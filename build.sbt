name := "gitbucket-navlink-plugin"
organization := "com.github.sikebe"
version := "0.0.1-SNAPSHOT"
scalaVersion := "2.12.4"
gitbucketVersion := "4.22.0"
scalacOptions := Seq("-deprecation")
javacOptions in compile ++= Seq("-source",
                                "1.8",
                                "-target",
                                "1.8",
                                "-encoding",
                                "UTF-8")