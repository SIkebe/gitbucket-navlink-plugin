package com.github.sikebe.navlink.service

import java.io.File

import gitbucket.core.util.Directory._
import gitbucket.core.util.SyntaxSugars._
import NavLinkSettingsService._
import scala.util.Using

trait NavLinkSettingsService {

  val NavLinkConf = new File(GitBucketHome, "navlink.conf")

  def saveNavLinkSettings(settings: NavLinkSettings): Unit =
    defining(new java.util.Properties()) { props =>
      props.setProperty(GlobalMenuName, settings.globalMenuName)
      props.setProperty(GlobalMenuPath, settings.globalMenuPath)
      Using.resource(new java.io.FileOutputStream(NavLinkConf)) { out => props.store(out, null) }
    }

  def loadNavLinkSettings(): NavLinkSettings =
    defining(new java.util.Properties()) { props =>
      if (NavLinkConf.exists) {
        Using.resource(new java.io.FileInputStream(NavLinkConf)) { in => props.load(in) }
      }
      NavLinkSettings(
        getValue[String](props, GlobalMenuName, ""),
        getValue[String](props, GlobalMenuPath, "")
      )
    }
}

object NavLinkSettingsService {
  import scala.reflect.ClassTag

  case class NavLinkSettings(globalMenuName: String, globalMenuPath: String)

  private val GlobalMenuName = "global_menu_name"
  private val GlobalMenuPath = "global_menu_path"

  private def getValue[A: ClassTag](props: java.util.Properties, key: String, default: A): A =
    defining(props.getProperty(key)) { value =>
      if (value == null || value.isEmpty) default
      else convertType(value).asInstanceOf[A]
    }

  private def convertType[A: ClassTag](value: String) =
    defining(implicitly[ClassTag[A]].runtimeClass) { c =>
      if (c == classOf[Boolean]) value.toBoolean
      else if (c == classOf[Int]) value.toInt
      else value
    }
}
