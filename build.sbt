// Skillink: Scala backend (rules, state, persistence) serving the static frontend in this folder.
// Open this folder in IntelliJ IDEA as an sbt project, then run skillink.SkillinkServer.
ThisBuild / scalaVersion := "2.13.18"
ThisBuild / version := "2.0.0"
ThisBuild / organization := "dev.skillink"

lazy val root = (project in file("."))
  .settings(
    name := "skillink",
    libraryDependencies += "com.lihaoyi" %% "ujson" % "4.4.3",
    Compile / run / fork := true,
    // The server serves index.html, css/, js/ and assets/ from the project folder.
    Compile / run / baseDirectory := (ThisBuild / baseDirectory).value,
    Compile / run / mainClass := Some("skillink.SkillinkServer"),
    scalacOptions ++= Seq("-deprecation", "-feature", "-unchecked")
  )
