name := "gitbucket-navlink-plugin"
organization := "com.github.sikebe"
version := "1.2.0"
scalaVersion := "3.8.3"
gitbucketVersion := "4.46.0"
scalacOptions := Seq("-deprecation")

ThisBuild / libraryDependencySchemes += "org.scala-lang.modules" %% "scala-xml" % VersionScheme.Always
