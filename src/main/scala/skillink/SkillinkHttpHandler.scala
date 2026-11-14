package skillink

import com.sun.net.httpserver.{HttpExchange, HttpHandler}
import java.nio.charset.StandardCharsets.UTF_8
import scala.util.control.NonFatal

/**
 * Routes:
 *   GET  /api/state   current state, {"rev", "state"}
 *   POST /api/action  one named action, e.g. {"type":"requestMeeting", ...}; returns the new state,
 *                     or {"error", "rev", "state"} with 400/403/404/409 when a rule rejects it
 *   GET  /...         the static frontend
 */
final class SkillinkHttpHandler(store: StateStore, files: StaticFiles, port: Int) extends HttpHandler {
  private val MaxBody = 1 << 20
  private val allowedOrigins = Set(s"http://localhost:$port", s"http://127.0.0.1:$port")

  override def handle(ex: HttpExchange): Unit =
    try route(ex)
    catch {
      case NonFatal(e) =>
        System.err.println(s"${ex.getRequestMethod} ${ex.getRequestURI}: ${e.getMessage}")
        try HttpResponses.error(ex, 500, "Something went wrong on the server. Check the IntelliJ run console.")
        catch { case NonFatal(_) => () }
    } finally ex.close()

  private def route(ex: HttpExchange): Unit = {
    val method = ex.getRequestMethod
    ex.getRequestURI.getPath match {
      case "/api/state" if method == "GET" => HttpResponses.json(ex, 200, store.snapshot())
      case "/api/action" if method == "POST" => postAction(ex)
      case p if p.startsWith("/api/") => HttpResponses.error(ex, 405, s"$method $p is not supported.")
      case _ if method == "GET" || method == "HEAD" => files.serve(ex)
      case _ => HttpResponses.error(ex, 405, s"$method is not supported here.")
    }
  }

  private def postAction(ex: HttpExchange): Unit = {
    // A JSON content type forces a CORS preflight, which this server never answers, so other
    // websites open in the same browser cannot post actions. The Origin check backs that up.
    val contentType = Option(ex.getRequestHeaders.getFirst("Content-Type")).getOrElse("")
    if (!contentType.toLowerCase.startsWith("application/json"))
      return HttpResponses.error(ex, 415, "Send actions as application/json.")
    val origin = Option(ex.getRequestHeaders.getFirst("Origin"))
    if (origin.exists(o => !allowedOrigins(o)))
      return HttpResponses.error(ex, 403, "Actions are only accepted from this Skillink page.")

    val bytes = ex.getRequestBody.readNBytes(MaxBody + 1)
    if (bytes.length > MaxBody) return HttpResponses.error(ex, 413, "That request is too large.")
    val action =
      try ujson.read(new String(bytes, UTF_8))
      catch { case NonFatal(_) => return HttpResponses.error(ex, 400, "The request is not valid JSON.", Some(store.snapshot())) }

    try HttpResponses.json(ex, 200, store.applyAction(action))
    catch {
      case r: ActionRejected => HttpResponses.error(ex, r.status, r.getMessage, Some(store.snapshot()))
    }
  }
}
