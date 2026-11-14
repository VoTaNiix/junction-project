package skillink

import java.nio.charset.StandardCharsets.UTF_8
import java.nio.file.{AtomicMoveNotSupportedException, Files, Path, StandardCopyOption}
import java.util.UUID
import scala.util.control.NonFatal

/**
 * Owns the one shared demo state. Every role (solver, host, organizer, privacy inspector) in every
 * browser tab reads and writes this copy, so a change in one role is visible in the others.
 *
 * Actions run on a working copy: if a rule rejects the action, nothing changes. Successful changes
 * are written to disk (atomically) before they become visible, so they survive a restart.
 */
final class StateStore(file: Path, seed: ujson.Value) {
  /** Changes on every successful action and on each server start, so browsers can tell when to refresh. */
  private val boot = UUID.randomUUID().toString.take(8)
  private var counter = 0L
  private var state: ujson.Value = loadOrSeed()

  private def rev: String = s"$boot-$counter"

  /** {"rev": "...", "state": {...}} for the browser. */
  def snapshot(): String = synchronized(envelope())

  /** Applies one action. Throws ActionRejected (with the unchanged state available via snapshot()). */
  def applyAction(action: ujson.Value): String = synchronized {
    val next = Rules.applyAction(Json.copy(state), action, seed)
    val leaks = Rules.forbiddenIn(next, "state")
    if (leaks.nonEmpty) Rules.reject(s"Refused to store forbidden fields: ${leaks.take(3).mkString(", ")}.", 500)
    persist(next)
    state = next
    counter += 1
    envelope()
  }

  private def envelope(): String = s"""{"rev":${ujson.write(ujson.Str(rev))},"state":${ujson.write(state)}}"""

  private def loadOrSeed(): ujson.Value = {
    if (Files.isRegularFile(file)) {
      try {
        val saved = ujson.read(Files.readString(file, UTF_8))
        if (Rules.looksValid(saved) && Rules.forbiddenIn(saved, "state").isEmpty) {
          println(s"Loaded saved demo state from $file")
          return saved
        }
        println(s"Saved state in $file is from another version; starting from the seed data.")
      } catch {
        case NonFatal(e) => println(s"Could not read $file (${e.getMessage}); starting from the seed data.")
      }
    }
    Json.copy(seed)
  }

  private def persist(next: ujson.Value): Unit = {
    Files.createDirectories(file.getParent)
    val tmp = file.resolveSibling(file.getFileName.toString + ".tmp")
    Files.writeString(tmp, next.render(indent = 2), UTF_8)
    try Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE)
    catch { case _: AtomicMoveNotSupportedException => Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING) }
  }
}
