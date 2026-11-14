package skillink

import com.sun.net.httpserver.HttpExchange
import java.nio.file.{Files, Path, Paths}

/**
 * Serves the frontend (index.html, css/, js/, assets/) straight from the project folder, so the
 * HTML, CSS and JavaScript stay ordinary files you can edit and reload without rebuilding.
 * Nothing outside those four entries is reachable (no data/, src/ or .git/).
 */
final class StaticFiles(root: Path) {
  private val allowedTop = Set("index.html", "css", "js", "assets")

  private val types = Map(
    "html" -> "text/html; charset=utf-8",
    "css" -> "text/css; charset=utf-8",
    "js" -> "text/javascript; charset=utf-8",
    "mjs" -> "text/javascript; charset=utf-8",
    "json" -> "application/json; charset=utf-8",
    "svg" -> "image/svg+xml",
    "webp" -> "image/webp",
    "png" -> "image/png",
    "jpg" -> "image/jpeg",
    "ico" -> "image/x-icon",
    "woff2" -> "font/woff2",
  )

  def serve(ex: HttpExchange): Unit = {
    val path = ex.getRequestURI.getPath
    val rel = if (path == "/" || path.isEmpty) "index.html" else path.stripPrefix("/")
    val safe = !rel.contains("..") && !rel.contains("\\") && !rel.contains(":") && !rel.contains("\u0000")
    val top = rel.takeWhile(_ != '/')
    val file = root.resolve(rel).normalize()
    if (!safe || !allowedTop(top) || !file.startsWith(root) || !Files.isRegularFile(file)) {
      HttpResponses.send(ex, 404, "text/plain; charset=utf-8", "Not found".getBytes("UTF-8"))
      return
    }
    val ext = rel.drop(rel.lastIndexOf('.') + 1).toLowerCase
    val contentType = types.getOrElse(ext, "application/octet-stream")
    HttpResponses.send(ex, 200, contentType, Files.readAllBytes(file), cache = "no-cache")
  }
}

object StaticFiles {
  /**
   * Finds the folder that holds index.html and js/store.js. IntelliJ and `sbt run` both start in the
   * project folder; -Dskillink.webroot=... or SKILLINK_WEBROOT overrides it.
   */
  def findWebRoot(): Path = {
    def isRoot(p: Path) = Files.isRegularFile(p.resolve("index.html")) && Files.isRegularFile(p.resolve("js").resolve("store.js"))
    val configured = sys.props.get("skillink.webroot").orElse(sys.env.get("SKILLINK_WEBROOT")).map(Paths.get(_).toAbsolutePath.normalize())
    configured match {
      case Some(p) if isRoot(p) => p
      case Some(p) => sys.error(s"skillink.webroot points to $p, but there is no index.html and js/store.js there.")
      case None =>
        val start = Paths.get("").toAbsolutePath.normalize()
        Iterator.iterate(start)(_.getParent).takeWhile(_ != null).take(5).find(isRoot).getOrElse(
          sys.error(s"Could not find index.html and js/store.js from $start. Run the server from the project folder, " +
            "or set the working directory of the IntelliJ run configuration to the project folder."))
    }
  }
}
