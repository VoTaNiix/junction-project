package skillink

import com.sun.net.httpserver.HttpExchange
import java.nio.charset.StandardCharsets.UTF_8

/** Writes responses with the same safe headers everywhere. */
object HttpResponses {
  def send(ex: HttpExchange, status: Int, contentType: String, body: Array[Byte], cache: String = "no-store"): Unit = {
    val h = ex.getResponseHeaders
    h.set("Content-Type", contentType)
    h.set("Cache-Control", cache)
    h.set("X-Content-Type-Options", "nosniff")
    h.set("Referrer-Policy", "no-referrer")
    h.set("X-Frame-Options", "DENY")
    if (ex.getRequestMethod == "HEAD") ex.sendResponseHeaders(status, -1)
    else {
      ex.sendResponseHeaders(status, if (body.isEmpty) -1 else body.length.toLong)
      if (body.nonEmpty) ex.getResponseBody.write(body)
    }
  }

  def json(ex: HttpExchange, status: Int, body: String): Unit =
    send(ex, status, "application/json; charset=utf-8", body.getBytes(UTF_8))

  /** An error the browser can show: {"error": "...", plus the current state when known}. */
  def error(ex: HttpExchange, status: Int, message: String, envelope: Option[String] = None): Unit = {
    val err = ujson.write(ujson.Str(message))
    val body = envelope match {
      case Some(env) => s"""{"error":$err,${env.stripPrefix("{")}"""
      case None => s"""{"error":$err}"""
    }
    json(ex, status, body)
  }
}
