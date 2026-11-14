package skillink

import scala.collection.mutable

/** Small helpers for reading and writing the ujson state tree, which mirrors the browser's JSON. */
object Json {
  def copy(v: ujson.Value): ujson.Value = ujson.read(ujson.write(v))

  /** A field that is present and not null. */
  def get(v: ujson.Value, key: String): Option[ujson.Value] =
    v.objOpt.flatMap(_.get(key)).filterNot(_.isNull)

  def str(v: ujson.Value, key: String): String = get(v, key).flatMap(_.strOpt).getOrElse("")

  def strOpt(v: ujson.Value, key: String): Option[String] = get(v, key).flatMap(_.strOpt)

  def id(v: ujson.Value): String = str(v, "id")

  /** A required list in the state, e.g. state.meetings. */
  def list(state: ujson.Value, key: String): mutable.ArrayBuffer[ujson.Value] =
    get(state, key).flatMap(_.arrOpt).getOrElse(Rules.corrupt(key))

  /** A required map in the state, e.g. state.feedback. */
  def map(state: ujson.Value, key: String): mutable.Map[String, ujson.Value] =
    get(state, key).flatMap(_.objOpt).getOrElse(Rules.corrupt(key))

  def find(state: ujson.Value, key: String, wanted: String): Option[ujson.Value] =
    list(state, key).find(x => id(x) == wanted)

  /** Increment a counter in a JSON object, creating it at 0. */
  def inc(m: mutable.Map[String, ujson.Value], key: String, by: Double = 1): Unit =
    m(key) = ujson.Num(m.get(key).flatMap(_.numOpt).getOrElse(0.0) + by)

  def strings(v: ujson.Value): Seq[String] = v.arrOpt.map(_.toSeq.flatMap(_.strOpt)).getOrElse(Nil)
}
