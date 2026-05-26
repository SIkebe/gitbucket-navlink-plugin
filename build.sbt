name := "gitbucket-navlink-plugin"
organization := "com.github.sikebe"
version := "1.3.0"
scalaVersion := "2.13.9"
gitbucketVersion := "4.46.0"
scalacOptions := Seq("-deprecation")

ThisBuild / libraryDependencySchemes += "org.scala-lang.modules" %% "scala-xml" % VersionScheme.Always
