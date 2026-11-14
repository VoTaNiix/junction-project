package skillink

import java.time.{Instant, LocalDate}
import java.util.concurrent.ThreadLocalRandom
import scala.collection.mutable
import scala.util.Try

import Json._

/** A rejected action. The message is shown to the person as-is, so it says what to do next. */
final class ActionRejected(val status: Int, message: String) extends RuntimeException(message)

/**
 * Every rule that changes Skillink state. The browser sends one named action per change; this
 * object validates it against the current state and applies it.
 *
 * js/store.js holds the same rules so the page responds instantly and still works when it is
 * opened without this server. When the two disagree, the server wins: the browser always adopts
 * the state returned here.
 *
 * Fairness guardrails enforced here (see .claude/skills/eu-ai-act-and-fairness):
 *  - no action may carry a demographic, pedigree or scoring field (FORBIDDEN_KEYS)
 *  - nothing ranks, scores or filters people; lists stay in insertion (chronological) order
 *  - identity is revealed only by an accepted meeting, never by this code directly
 *  - purge and consent withdrawal keep anonymous counts only
 */
object Rules {
  val StateVersion = 2
  val RequestCap = 5
  val LogLimit = 60

  val Formats: Set[String] = Set("hiring", "rnd", "pilot", "open")
  val Intents: Set[String] = Set("talent", "research", "partner", "open")
  val AnswerLanguages: Set[String] = Set("en", "fi", "sv", "other")
  val AnswerStyles: Set[String] = Set("prose", "bullets")
  val FeedbackSides: Set[String] = Set("participant", "host")
  val FeedbackChoices: Set[String] = Set("continue", "notnow")

  /** Keys that must never exist anywhere in state or in an incoming action. Same list as js/store.js. */
  val ForbiddenKeys: Set[String] = Set(
    "nationality", "ethnicity", "ethnicBackground", "race", "age", "birthDate", "dateOfBirth",
    "gender", "sex", "photo", "photoUrl", "avatar", "religion", "maritalStatus", "disability",
    "cv", "resume", "score", "matchScore", "rank", "rating", "fitScore",
    "pitchDeck", "logo", "logoUrl", "companySize", "employeeCount", "fundingStage", "revenue",
  )

  private val ChallengeFields = Set(
    "companyId", "title", "summary", "formats", "context", "tricky", "escoTags", "language",
    "languages", "industry", "deadline", "coWritten",
  )

  // ---------- errors ----------
  def reject(message: String, status: Int = 400): Nothing = throw new ActionRejected(status, message)
  private def conflict(message: String): Nothing = reject(message, 409)
  private def gone(what: String): Nothing = reject(s"That $what no longer exists. Reload the page and try again.", 404)
  def corrupt(key: String): Nothing =
    reject(s"The saved demo state is missing '$key'. Use Reset demo data to restore it.", 500)

  private def now(): String = Instant.now().toString

  // ---------- reading the action ----------
  private def field(a: ujson.Value, key: String): Option[ujson.Value] = get(a, key)

  private def text(a: ujson.Value, key: String, label: String, max: Int): String =
    field(a, key).flatMap(_.strOpt).map(_.trim).filter(_.nonEmpty) match {
      case Some(t) if t.length <= max => t
      case Some(_) => reject(s"$label is too long. Keep it under $max characters.")
      case None => reject(s"$label is missing.")
    }

  private def optText(a: ujson.Value, key: String, label: String, max: Int): String = {
    val t = field(a, key).flatMap(_.strOpt).map(_.trim).getOrElse("")
    if (t.length > max) reject(s"$label is too long. Keep it under $max characters.")
    t
  }

  private def flag(a: ujson.Value, key: String): Boolean = field(a, key).flatMap(_.boolOpt).getOrElse(false)

  private def oneOf(a: ujson.Value, key: String, allowed: Set[String], label: String, default: Option[String] = None): String =
    field(a, key).flatMap(_.strOpt).orElse(default) match {
      case Some(v) if allowed(v) => v
      case _ => reject(s"$label must be one of: ${allowed.toSeq.sorted.mkString(", ")}.")
    }

  private def textList(a: ujson.Value, key: String, label: String, maxItems: Int, maxLen: Int): Seq[String] = {
    val items = field(a, key) match {
      case None => Nil
      case Some(ujson.Arr(xs)) =>
        xs.toSeq.map {
          case ujson.Str(s) if s.trim.nonEmpty && s.length <= maxLen => s.trim
          case _ => reject(s"$label contains an invalid entry.")
        }
      case Some(_) => reject(s"$label must be a list.")
    }
    if (items.size > maxItems) reject(s"$label can have at most $maxItems entries.")
    items.distinct
  }

  private def idArg(a: ujson.Value, key: String): String = text(a, key, key, 64)

  // ---------- lookups ----------
  private def participant(s: ujson.Value, pid: String) = find(s, "participants", pid).getOrElse(gone("solver"))
  private def company(s: ujson.Value, cid: String) = find(s, "companies", cid).getOrElse(gone("host"))
  private def challenge(s: ujson.Value, chId: String) = find(s, "challenges", chId).getOrElse(gone("challenge"))
  private def slot(s: ujson.Value, slotId: String) = find(s, "slots", slotId).getOrElse(gone("time slot"))
  private def meeting(s: ujson.Value, mId: String) = find(s, "meetings", mId).getOrElse(gone("conversation"))
  private def submission(s: ujson.Value, subId: String) = find(s, "submissions", subId).getOrElse(gone("approach"))

  private def companyName(s: ujson.Value, cid: String): String =
    find(s, "companies", cid).map(str(_, "name")).getOrElse("Host")

  def pseudoLabel(s: ujson.Value, pid: String): String =
    find(s, "participants", pid).map(p => s"Solver #${str(p, "pseudo")}").getOrElse("Solver (deleted)")

  // ---------- meeting rules (same as js/store.js) ----------
  def isActive(m: ujson.Value): Boolean = { val st = str(m, "partyStatus"); st != "declined" && st != "cancelled" }
  def canRevealIdentity(m: ujson.Value): Boolean = str(m, "partyStatus") == "accepted"
  def isConfirmed(m: ujson.Value): Boolean = canRevealIdentity(m) && str(m, "organizerStatus") == "approved"
  private def stillOpen(m: ujson.Value): Boolean = isActive(m) && str(m, "organizerStatus") != "declined"

  def activeRequestCount(s: ujson.Value, pid: String): Int =
    list(s, "meetings").count(m => str(m, "participantId") == pid && str(m, "initiator") == "participant" && isActive(m))

  def slotTaken(s: ujson.Value, slotId: String): Boolean =
    list(s, "meetings").exists(m => str(m, "slotId") == slotId && stillOpen(m))

  def existingMeeting(s: ujson.Value, pid: String, chId: String): Option[ujson.Value] =
    list(s, "meetings").find(m => str(m, "participantId") == pid && str(m, "challengeId") == chId && stillOpen(m))

  // ---------- ids and the decision log ----------
  private val IdPattern = "^[a-z]{1,3}-[a-z0-9]{3,16}$".r

  /** Use the id the browser generated (so both copies agree) when it is well formed and unused. */
  private def newId(prefix: String, requested: Option[String], taken: String => Boolean): String = {
    val ok = requested.filter(r => IdPattern.matches(r) && r.startsWith(prefix + "-") && !taken(r))
    ok.getOrElse {
      var candidate = ""
      while ({ candidate = s"$prefix-${java.lang.Long.toString(ThreadLocalRandom.current().nextLong(1L << 30, 1L << 34), 36)}"; taken(candidate) }) ()
      candidate
    }
  }

  private def log(s: ujson.Value, actor: String, action: String, detail: String): Unit = {
    val entries = list(s, "decisionLog")
    entries.prepend(ujson.Obj("at" -> now(), "actor" -> actor, "action" -> action, "detail" -> detail))
    if (entries.length > LogLimit) entries.remove(LogLimit, entries.length - LogLimit)
  }

  // ---------- entry point ----------
  /** Applies one action to a working copy of the state and returns the new state. */
  def applyAction(s: ujson.Value, a: ujson.Value, seed: => ujson.Value): ujson.Value = {
    if (a.objOpt.isEmpty) reject("The request must be a JSON object.")
    forbiddenIn(a, "action").headOption.foreach { path =>
      reject(s"Skillink never stores demographic, pedigree or scoring data, so the field '${path.split('.').last}' is not accepted.")
    }
    str(a, "type") match {
      case "reset" => return copy(seed)
      case "requestMeeting" => requestMeeting(s, a)
      case "inviteParticipant" => inviteParticipant(s, a)
      case "respondToMeeting" => respondToMeeting(s, a)
      case "cancelMeeting" => cancelMeeting(s, a)
      case "organizerDecision" => organizerDecision(s, a)
      case "toggleBookmark" => toggleBookmark(s, a)
      case "saveSubmission" => saveSubmission(s, a)
      case "withdrawSubmission" => withdrawSubmission(s, a)
      case "deleteDraft" => deleteDraft(s, a)
      case "createParticipant" => createParticipant(s, a)
      case "selectCompany" => selectCompany(s, a)
      case "selectParticipant" => selectParticipant(s, a)
      case "addChallenge" => addChallenge(s, a)
      case "requestCoWriting" => requestCoWriting(s, a)
      case "setFeedback" => setFeedback(s, a)
      case "clearFeedback" => clearFeedback(s)
      case "purgePersonalData" => purgePersonalData(s)
      case "deleteParticipantData" => deleteParticipantData(s, a)
      case "" => reject("The action has no type.")
      case other => reject(s"Unknown action '$other'.")
    }
    s
  }

  // ---------- meetings ----------
  private def requestMeeting(s: ujson.Value, a: ujson.Value): Unit = {
    val pid = idArg(a, "participantId")
    participant(s, pid)
    val ch = challenge(s, idArg(a, "challengeId"))
    val sl = slot(s, idArg(a, "slotId"))
    val format = oneOf(a, "format", Formats, "Conversation format", Some("open"))
    if (str(sl, "companyId") != str(ch, "companyId")) reject("That time belongs to a different host. Pick one of this host's times.")
    if (activeRequestCount(s, pid) >= RequestCap)
      conflict(s"You have used all $RequestCap meeting requests. Cancel one to request another.")
    if (existingMeeting(s, pid, id(ch)).isDefined) conflict("You already have a conversation request open for this challenge.")
    if (slotTaken(s, id(sl))) conflict("That time was just taken. Pick another time.")
    val ms = list(s, "meetings")
    ms += ujson.Obj(
      "id" -> newId("m", strOpt(a, "id"), x => ms.exists(id(_) == x)),
      "challengeId" -> id(ch), "companyId" -> str(ch, "companyId"), "participantId" -> pid, "slotId" -> id(sl),
      "format" -> format, "initiator" -> "participant", "partyStatus" -> "requested", "organizerStatus" -> "pending",
      "createdAt" -> now(),
    )
    log(s, "solver", "requested meeting", s"${pseudoLabel(s, pid)} → ${companyName(s, str(ch, "companyId"))}")
  }

  private def inviteParticipant(s: ujson.Value, a: ujson.Value): Unit = {
    val cid = idArg(a, "companyId")
    company(s, cid)
    val pid = idArg(a, "participantId")
    participant(s, pid)
    val ch = challenge(s, idArg(a, "challengeId"))
    val sl = slot(s, idArg(a, "slotId"))
    val format = oneOf(a, "format", Formats, "Conversation format", Some("open"))
    if (str(ch, "companyId") != cid) reject("You can only invite solvers to your own challenges.", 403)
    if (str(sl, "companyId") != cid) reject("That time belongs to a different host. Pick one of your times.")
    val shared = list(s, "submissions").exists(x =>
      str(x, "participantId") == pid && str(x, "challengeId") == id(ch) && str(x, "status") == "submitted")
    if (!shared) conflict("This solver has not shared thinking on that challenge, so there is nothing to invite them about yet.")
    if (existingMeeting(s, pid, id(ch)).isDefined) conflict("There is already an open conversation with this solver for this challenge.")
    if (slotTaken(s, id(sl))) conflict("That time is already booked. Pick another time.")
    val ms = list(s, "meetings")
    ms += ujson.Obj(
      "id" -> newId("m", strOpt(a, "id"), x => ms.exists(id(_) == x)),
      "challengeId" -> id(ch), "companyId" -> cid, "participantId" -> pid, "slotId" -> id(sl),
      "format" -> format, "initiator" -> "host", "partyStatus" -> "invited", "organizerStatus" -> "pending",
      "createdAt" -> now(),
    )
    log(s, "host", "invited solver", s"${companyName(s, cid)} → ${pseudoLabel(s, pid)}")
  }

  /** The counterparty answers: the solver answers invitations, the host answers requests. */
  private def respondToMeeting(s: ujson.Value, a: ujson.Value): Unit = {
    val m = meeting(s, idArg(a, "meetingId"))
    val accept = flag(a, "accept")
    val status = str(m, "partyStatus")
    if (status != "requested" && status != "invited") conflict("This conversation has already been answered.")
    val actor = if (str(m, "initiator") == "participant") "host" else "solver"
    m("partyStatus") = if (accept) "accepted" else "declined"
    m("respondedAt") = now()
    log(s, actor, if (accept) "accepted meeting" else "declined meeting",
      s"${companyName(s, str(m, "companyId"))} / ${pseudoLabel(s, str(m, "participantId"))}")
  }

  private def cancelMeeting(s: ujson.Value, a: ujson.Value): Unit = {
    val m = meeting(s, idArg(a, "meetingId"))
    if (!isActive(m)) conflict("This conversation is already closed.")
    m("partyStatus") = "cancelled"
    log(s, "solver", "cancelled request", s"${pseudoLabel(s, str(m, "participantId"))} → ${companyName(s, str(m, "companyId"))}")
  }

  private def organizerDecision(s: ujson.Value, a: ujson.Value): Unit = {
    val m = meeting(s, idArg(a, "meetingId"))
    val approve = flag(a, "approve")
    if (approve && !canRevealIdentity(m)) conflict("Both sides must agree before the event team can approve this conversation.")
    if (!approve && !isActive(m)) conflict("This conversation is already closed.")
    m("organizerStatus") = if (approve) "approved" else "declined"
    m("organizerAt") = now()
    val feedback = map(s, "feedback")
    if (approve && isConfirmed(m) && !feedback.contains(id(m)))
      feedback(id(m)) = ujson.Obj("participant" -> ujson.Null, "host" -> ujson.Null)
    log(s, "organizer", if (approve) "approved meeting" else "declined meeting",
      s"${companyName(s, str(m, "companyId"))} / ${pseudoLabel(s, str(m, "participantId"))}")
  }

  // ---------- solver workspace ----------
  private def toggleBookmark(s: ujson.Value, a: ujson.Value): Unit = {
    val pid = idArg(a, "participantId")
    participant(s, pid)
    val chId = id(challenge(s, idArg(a, "challengeId")))
    val bookmarks = map(s, "bookmarks")
    val saved = bookmarks.getOrElseUpdate(pid, ujson.Arr()).arr
    val i = saved.indexWhere(_.strOpt.contains(chId))
    if (i >= 0) saved.remove(i) else saved += ujson.Str(chId)
  }

  private def saveSubmission(s: ujson.Value, a: ujson.Value): Unit = {
    val pid = idArg(a, "participantId")
    participant(s, pid)
    val ch = challenge(s, idArg(a, "challengeId"))
    val submit = flag(a, "submit")
    val data = field(a, "data").filter(_.objOpt.isDefined).getOrElse(reject("The approach is missing."))
    val intent = oneOf(data, "intent", Intents, "Intent", Some("open"))
    val lang = oneOf(data, "lang", AnswerLanguages, "Language", Some("en"))
    val langOther = optText(data, "langOther", "Other language", 60)
    val style = oneOf(data, "format", AnswerStyles, "Answer style", Some("prose"))
    val skills = textList(data, "skills", "ESCO skills", 30, 60)
    val answersIn = field(data, "answers").filter(_.objOpt.isDefined).getOrElse(ujson.Obj())
    val answers = Seq("first", "why", "questions").map(k => k -> optText(answersIn, k, "Each answer", 6000))
    if (submit) answers.find(_._2.isEmpty).foreach(_ => reject("Write at least one line in each of the three parts before sharing."))

    val subs = list(s, "submissions")
    val sub = subs.find(x => str(x, "participantId") == pid && str(x, "challengeId") == id(ch)).getOrElse {
      val created = ujson.Obj(
        "id" -> newId("s", strOpt(a, "id"), x => subs.exists(id(_) == x)),
        "challengeId" -> id(ch), "participantId" -> pid, "status" -> "draft", "translations" -> ujson.Obj(),
      )
      subs += created
      created
    }
    if (str(sub, "status") == "submitted" && !submit) conflict("This approach is already shared. Withdraw it first to edit it.")
    sub("intent") = intent
    sub("lang") = lang
    sub("langOther") = langOther
    sub("format") = style
    sub("skills") = ujson.Arr.from(skills.map(ujson.Str(_)))
    sub("answers") = ujson.Obj.from(answers.map { case (k, v) => k -> ujson.Str(v) })
    sub("updatedAt") = now()
    if (submit) {
      sub("status") = "submitted"
      sub("submittedAt") = now()
      map(s, "consents")(pid) = ujson.Obj("purpose" -> "event-matchmaking", "at" -> now())
      log(s, "solver", "shared approach", s"${pseudoLabel(s, pid)} → ${str(ch, "title")}")
    }
  }

  private def withdrawSubmission(s: ujson.Value, a: ujson.Value): Unit = {
    val sub = submission(s, idArg(a, "submissionId"))
    sub("status") = "draft"
    sub.obj.remove("submittedAt")
  }

  private def deleteDraft(s: ujson.Value, a: ujson.Value): Unit = {
    val sub = submission(s, idArg(a, "submissionId"))
    if (str(sub, "status") != "draft") conflict("Only private drafts can be deleted. Withdraw the shared approach first.")
    list(s, "submissions").filterInPlace(x => id(x) != id(sub))
  }

  private def createParticipant(s: ujson.Value, a: ujson.Value): Unit = {
    val people = list(s, "participants")
    val taken = (n: String) => people.exists(p => id(p) == s"p-$n")
    val requested = strOpt(a, "n").filter(n => n.matches("^[1-9][0-9]{3}$") && !taken(n))
    val n = requested.getOrElse {
      var c = ""
      while ({ c = (1000 + ThreadLocalRandom.current().nextInt(8999)).toString; taken(c) }) ()
      c
    }
    val p = ujson.Obj("id" -> s"p-$n", "pseudo" -> s"ESP-$n", "name" -> "New demo solver", "email" -> s"solver.$n@example.com")
    people += p
    s("currentParticipantId") = id(p)
  }

  /** Which demo solver the Talent side acts as (demo role switching, like selectCompany). */
  private def selectParticipant(s: ujson.Value, a: ujson.Value): Unit =
    s("currentParticipantId") = id(participant(s, idArg(a, "participantId")))

  // ---------- hosts ----------
  private def selectCompany(s: ujson.Value, a: ujson.Value): Unit =
    s("currentCompanyId") = id(company(s, idArg(a, "companyId")))

  private def addChallenge(s: ujson.Value, a: ujson.Value): Unit = {
    val data = field(a, "data").filter(_.objOpt.isDefined).getOrElse(reject("The challenge is missing."))
    data.obj.keys.find(k => !ChallengeFields(k)).foreach(k => reject(s"The field '$k' is not part of a challenge."))
    val cid = id(company(s, idArg(data, "companyId")))
    val title = text(data, "title", "The title", 120)
    val summary = text(data, "summary", "The one-line summary", 160)
    val context = text(data, "context", "The context", 5000)
    val tricky = text(data, "tricky", "What makes this tricky", 5000)
    if ("""\[[^\]]+\]""".r.findFirstIn(title + summary + context + tricky).isDefined)
      reject("Some template [brackets] are still in the text. Replace them with your real details.")
    val formats = textList(data, "formats", "Collaboration formats", 4, 10)
    if (formats.isEmpty || !formats.forall(Formats)) reject("Choose at least one collaboration format.")
    val tags = textList(data, "escoTags", "ESCO skills", 20, 60)
    if (tags.isEmpty) reject("Add at least one ESCO skill.")
    val language = text(data, "language", "The language requirement", 200)
    val languages = textList(data, "languages", "Languages", 10, 20)
    val industry = text(data, "industry", "The sector or topic", 80)
    val deadline = text(data, "deadline", "The deadline", 10)
    if (Try(LocalDate.parse(deadline)).isFailure) reject("The deadline must be a date.")
    val eventDate = get(s, "event").flatMap(strOpt(_, "date")).flatMap(d => Try(LocalDate.parse(d)).toOption)
    eventDate.foreach(d => if (!LocalDate.parse(deadline).isBefore(d)) reject("The deadline must be before the event day."))

    val challenges = list(s, "challenges")
    challenges += ujson.Obj(
      "id" -> newId("ch", strOpt(a, "id"), x => challenges.exists(id(_) == x)),
      "createdAt" -> now(), "companyId" -> cid, "title" -> title, "summary" -> summary,
      "formats" -> ujson.Arr.from(formats.map(ujson.Str(_))), "context" -> context, "tricky" -> tricky,
      "escoTags" -> ujson.Arr.from(tags.map(ujson.Str(_))), "language" -> language,
      "languages" -> ujson.Arr.from(languages.map(ujson.Str(_))), "industry" -> industry, "deadline" -> deadline,
      "coWritten" -> flag(data, "coWritten"),
    )
    log(s, "host", "published challenge", s"${companyName(s, cid)}: $title")
  }

  private def requestCoWriting(s: ujson.Value, a: ujson.Value): Unit = {
    val cid = id(company(s, idArg(a, "companyId")))
    val note = optText(a, "note", "The note", 500)
    val requests = list(s, "coWriteRequests")
    requests += ujson.Obj(
      "id" -> newId("cw", strOpt(a, "id"), x => requests.exists(id(_) == x)),
      "companyId" -> cid, "note" -> note, "at" -> now(), "status" -> "queued",
    )
  }

  // ---------- post-event mutual opt-in ----------
  private def setFeedback(s: ujson.Value, a: ujson.Value): Unit = {
    val m = meeting(s, idArg(a, "meetingId"))
    if (!isConfirmed(m)) conflict("Choices open only after a confirmed conversation.")
    val side = oneOf(a, "side", FeedbackSides, "Side")
    val choice = oneOf(a, "choice", FeedbackChoices, "Choice")
    val f = map(s, "feedback").getOrElseUpdate(id(m), ujson.Obj("participant" -> ujson.Null, "host" -> ujson.Null))
    f(side) = choice
  }

  private def clearFeedback(s: ujson.Value): Unit = {
    val feedback = map(s, "feedback")
    feedback.keys.toSeq.foreach(k => feedback(k) = ujson.Obj("participant" -> ujson.Null, "host" -> ujson.Null))
  }

  // ---------- 30-day purge and consent withdrawal ----------
  private def purgePersonalData(s: ujson.Value): Unit = {
    val before = Aggregates.inventory(s)
    val snapshot = Aggregates.personAggregates(s)
    val purge = get(s, "purge").getOrElse(corrupt("purge"))
    purge("aggregates") = get(purge, "aggregates").map(Aggregates.addInto(_, snapshot)).getOrElse(snapshot)
    s("participants") = ujson.Arr()
    s("submissions") = ujson.Arr()
    s("bookmarks") = ujson.Obj()
    s("meetings") = ujson.Arr()
    s("feedback") = ujson.Obj()
    s("consents") = ujson.Obj()
    s("coWriteRequests") = ujson.Arr()
    s("decisionLog") = ujson.Arr()
    list(s, "companies").foreach { c =>
      c("hostName") = ujson.Null
      c("hostRole") = ujson.Null
      c("hostEmail") = ujson.Null
    }
    s("currentParticipantId") = ujson.Null
    purge("done") = true
    purge("at") = now()
    purge("ledger") = ujson.Obj("before" -> before, "after" -> Aggregates.inventory(s))
  }

  private def deleteParticipantData(s: ujson.Value, a: ujson.Value): Unit = {
    val pid = id(participant(s, idArg(a, "participantId")))
    // Snapshot this one solver's contribution as anonymous counts before erasing it.
    val only = ujson.Obj.from(s.obj.toSeq)
    only("participants") = ujson.Arr.from(list(s, "participants").filter(id(_) == pid))
    only("submissions") = ujson.Arr.from(list(s, "submissions").filter(str(_, "participantId") == pid))
    only("meetings") = ujson.Arr.from(list(s, "meetings").filter(str(_, "participantId") == pid))
    only("bookmarks") = ujson.Obj(pid -> map(s, "bookmarks").getOrElse(pid, ujson.Arr()))
    val snapshot = Aggregates.personAggregates(only)
    val purge = get(s, "purge").getOrElse(corrupt("purge"))
    purge("aggregates") = get(purge, "aggregates").map(Aggregates.addInto(_, snapshot)).getOrElse(snapshot)

    val meetingIds = list(only, "meetings").map(id).toSet
    list(s, "participants").filterInPlace(id(_) != pid)
    list(s, "submissions").filterInPlace(str(_, "participantId") != pid)
    list(s, "meetings").filterInPlace(m => !meetingIds(id(m)))
    meetingIds.foreach(map(s, "feedback").remove)
    map(s, "bookmarks").remove(pid)
    map(s, "consents").remove(pid)
    if (str(s, "currentParticipantId") == pid) s("currentParticipantId") = ujson.Null
  }

  // ---------- compliance audit ----------
  /** Paths of any forbidden key anywhere in the tree. Must stay empty for state. */
  def forbiddenIn(node: ujson.Value, path: String): Seq[String] = node match {
    case ujson.Arr(xs) => xs.toSeq.zipWithIndex.flatMap { case (v, i) => forbiddenIn(v, s"$path[$i]") }
    case ujson.Obj(m) =>
      m.toSeq.flatMap { case (k, v) => (if (ForbiddenKeys(k)) Seq(s"$path.$k") else Nil) ++ forbiddenIn(v, s"$path.$k") }
    case _ => Nil
  }

  /** Loose structural check for state loaded from disk. */
  def looksValid(s: ujson.Value): Boolean =
    s.objOpt.isDefined && get(s, "version").flatMap(_.numOpt).contains(StateVersion.toDouble) &&
      Seq("companies", "challenges", "participants", "submissions", "slots", "meetings", "coWriteRequests", "decisionLog")
        .forall(k => get(s, k).flatMap(_.arrOpt).isDefined) &&
      Seq("event", "feedback", "bookmarks", "consents", "purge").forall(k => get(s, k).flatMap(_.objOpt).isDefined)
}
