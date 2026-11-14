package skillink

import com.sun.net.httpserver.HttpServer
import java.net.{BindException, InetAddress, InetSocketAddress}
import java.nio.charset.StandardCharsets.UTF_8
import java.util.concurrent.Executors

/**
 * Starts Skillink. In IntelliJ: open SkillinkServer.scala and click the green Run arrow next to
 * `object SkillinkServer`, then open the URL printed in the console.
 *
 * Binds to 127.0.0.1 only: this is a local demo with fictional data, not an internet service.
 */
object SkillinkServer {
  val DefaultPort = 8081
  val Palette = "blue"

  def main(args: Array[String]): Unit = {
    val port = sys.props.get("skillink.port").orElse(sys.env.get("PORT")).flatMap(_.toIntOption).getOrElse(DefaultPort)
    val webRoot = StaticFiles.findWebRoot()
    val store = new StateStore(webRoot.resolve("data").resolve("state.json"), loadSeed())

    val server =
      try HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress, port), 0)
      catch {
        case _: BindException =>
          System.err.println(s"Port $port is already in use. Stop the other server, or run with -Dskillink.port=8090.")
          sys.exit(1)
      }
    server.createContext("/", new SkillinkHttpHandler(store, new StaticFiles(webRoot), port))
    server.setExecutor(Executors.newFixedThreadPool(4))
    server.start()
    sys.addShutdownHook(server.stop(0))

    println(s"Skillink ($Palette palette) is running at http://localhost:$port")
    println(s"Serving the frontend from $webRoot")
    println(s"Demo state is saved in ${webRoot.resolve("data").resolve("state.json")}")
    println("Every role shares this server's state. Use Reset demo data in the header to restore the seed.")
  }

  /** The synthetic seed, exported from js/seed.js by scripts/export-seed.mjs. */
  private def loadSeed(): ujson.Value = {
    val in = getClass.getResourceAsStream("/seed.json")
    if (in == null) sys.error("seed.json is missing from src/main/resources. Run: node scripts/export-seed.mjs")
    try ujson.read(new String(in.readAllBytes(), UTF_8))
    finally in.close()
  }
}
