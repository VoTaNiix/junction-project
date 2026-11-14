package skillink

import java.util.Locale
import scala.collection.mutable

import Json._

/**
 * Anonymous counts kept when personal data is deleted. Never describes an individual or a team:
 * only totals per challenge, skill, language, intent, format and company. Same shape as
 * computePersonAggregates() in js/store.js, so the Insights and Company reports views can read it.
 */
object Aggregates {
  private final case class Theme(id: String, words: Seq[String])

  private val Themes = Seq(
    Theme("data", Seq("data", "metric", "measure", "log", "kpi", "forecast", "how many", "how much", "mitta", "mätdata", "hur många")),
    Theme("people", Seq("user", "customer", "resident", "passenger", "pedestrian", "asiakas", "käyttäjä", "asukas", "kund", "användare", "invånare")),
    Theme("ownership", Seq("who ", "owns", "owner", "decide", "approv", "legal", "kuka", "päättää", "vem", "äger")),
    Theme("risk", Seq("cost", "budget", "warranty", "safety", "risk", "penalis", "contract", "worse", "kustann", "riski", "säkerhet")),
    Theme("access", Seq("can i", "visit", "ride", "read", "remote access", "on site", "voinko", "paikan päällä")),
    Theme("success", Seq("success", "goal", "matters more", "consider", "onnistu", "tavoite", "mål", "actually used")),
  )

  private def questionText(sub: ujson.Value): String = {
    val translated = get(sub, "translations").flatMap(get(_, "en")).flatMap(strOpt(_, "questions"))
    translated.orElse(get(sub, "answers").flatMap(strOpt(_, "questions"))).getOrElse("").toLowerCase(Locale.ROOT)
  }

  private def themeCounts(subs: Seq[ujson.Value]): (ujson.Obj, Int) = {
    val counts = ujson.Obj.from(Themes.map(t => t.id -> ujson.Num(0)))
    var questions = 0
    subs.foreach { sub =>
      val text = questionText(sub)
      questions += text.count(_ == '?')
      Themes.foreach(t => if (t.words.exists(text.contains)) inc(counts.obj, t.id))
    }
    (counts, questions)
  }

  private def feedbackOf(s: ujson.Value, meetingId: String): Option[ujson.Value] = map(s, "feedback").get(meetingId)

  private def answered(f: ujson.Value): Boolean = get(f, "participant").isDefined && get(f, "host").isDefined
  private def bothContinue(f: ujson.Value): Boolean = str(f, "participant") == "continue" && str(f, "host") == "continue"

  private def countBy(items: Seq[ujson.Value])(key: ujson.Value => String): ujson.Obj = {
    val out = ujson.Obj()
    items.foreach(x => inc(out.obj, key(x)))
    out
  }

  private def langOf(sub: ujson.Value) = strOpt(sub, "lang").getOrElse("other")
  private def intentOf(sub: ujson.Value) = strOpt(sub, "intent").getOrElse("open")
  private def formatOf(m: ujson.Value) = strOpt(m, "format").getOrElse("open")

  def personAggregates(s: ujson.Value): ujson.Value = {
    val submitted = list(s, "submissions").toSeq.filter(str(_, "status") == "submitted")
    val meetings = list(s, "meetings").toSeq
    val confirmed = meetings.filter(Rules.isConfirmed)

    val responsesPerChallenge = countBy(submitted)(str(_, "challengeId"))
    val skillSupply = ujson.Obj()
    submitted.foreach(sub => get(sub, "skills").map(strings).getOrElse(Nil).foreach(k => inc(skillSupply.obj, k)))

    val meetingCounts = ujson.Obj("requested" -> 0, "invited" -> 0, "confirmed" -> 0, "declined" -> 0)
    meetings.foreach { m =>
      inc(meetingCounts.obj, if (str(m, "initiator") == "participant") "requested" else "invited")
      if (Rules.isConfirmed(m)) inc(meetingCounts.obj, "confirmed")
      if (str(m, "partyStatus") == "declined" || str(m, "organizerStatus") == "declined") inc(meetingCounts.obj, "declined")
    }

    val optIn = ujson.Obj("mutual" -> 0, "answered" -> 0, "held" -> 0)
    confirmed.foreach { m =>
      inc(optIn.obj, "held")
      feedbackOf(s, Json.id(m)).filter(answered).foreach { f =>
        inc(optIn.obj, "answered")
        if (bothContinue(f)) inc(optIn.obj, "mutual")
      }
    }

    val bookmarked = map(s, "bookmarks").values.toSeq.flatMap(strings)
    val byCompany = ujson.Obj()
    list(s, "companies").foreach { c =>
      val cid = Json.id(c)
      val chIds = list(s, "challenges").filter(str(_, "companyId") == cid).map(Json.id).toSet
      val subs = submitted.filter(x => chIds(str(x, "challengeId")))
      val ms = meetings.filter(str(_, "companyId") == cid)
      val conf = ms.filter(Rules.isConfirmed)
      val (themes, questions) = themeCounts(subs)
      byCompany(cid) = ujson.Obj(
        "responses" -> subs.size,
        "bookmarks" -> bookmarked.count(chIds),
        "requests" -> ms.count(str(_, "initiator") == "participant"),
        "invites" -> ms.count(str(_, "initiator") == "host"),
        "mutual" -> ms.count(Rules.canRevealIdentity),
        "confirmed" -> conf.size,
        "continued" -> conf.count(m => feedbackOf(s, Json.id(m)).exists(f => answered(f) && bothContinue(f))),
        "themes" -> themes,
        "questions" -> questions,
        "languages" -> countBy(subs)(langOf),
        "intents" -> countBy(subs)(intentOf),
        "confirmedFormats" -> countBy(conf)(formatOf),
      )
    }

    ujson.Obj(
      "responsesPerChallenge" -> responsesPerChallenge,
      "skillSupply" -> skillSupply,
      "languages" -> countBy(submitted)(langOf),
      "intents" -> countBy(submitted)(intentOf),
      "meetingFormats" -> countBy(meetings)(formatOf),
      "confirmedFormats" -> countBy(confirmed)(formatOf),
      "meetings" -> meetingCounts,
      "optIn" -> optIn,
      "byCompany" -> byCompany,
    )
  }

  /** Adds every number in src into target (recursively), creating keys as needed. Returns target. */
  def addInto(target: ujson.Value, src: ujson.Value): ujson.Value = {
    val t = target.obj
    src.obj.foreach {
      case (k, ujson.Num(n)) => inc(t, k, n)
      case (k, v @ ujson.Obj(_)) =>
        val child = t.get(k).filter(_.objOpt.isDefined).getOrElse { val c = ujson.Obj(); t(k) = c; c }
        addInto(child, v)
      case _ => ()
    }
    target
  }

  /** How much personal data the state holds, by kind. Shown before and after the purge. */
  def inventory(s: ujson.Value): ujson.Value = {
    val subs = list(s, "submissions")
    ujson.Obj(
      "participants" -> list(s, "participants").size,
      "submissions" -> subs.count(str(_, "status") == "submitted"),
      "drafts" -> subs.count(str(_, "status") == "draft"),
      "bookmarks" -> map(s, "bookmarks").values.toSeq.map(strings(_).size).sum,
      "meetings" -> list(s, "meetings").size,
      "feedback" -> map(s, "feedback").size,
      "consents" -> map(s, "consents").size,
      "hostContacts" -> list(s, "companies").count(c => get(c, "hostEmail").isDefined),
      "decisionLog" -> list(s, "decisionLog").size,
    )
  }
}
