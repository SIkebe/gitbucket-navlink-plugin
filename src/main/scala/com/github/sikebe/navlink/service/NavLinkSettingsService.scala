package com.github.sikebe.navlink.service

import java.io.File

import gitbucket.core.util.Directory._
import NavLinkSettingsService._
import scala.util.{Try, Using}

trait NavLinkSettingsService {

  val NavLinkConf = new File(GitBucketHome, "navlink.conf")

  def saveNavLinkSettings(settings: NavLinkSettings): Unit = {
    val props = new java.util.Properties()
    val navlinks = sanitize(settings.navLinks)
    props.setProperty(NavLinkCount, navlinks.size.toString)
    navlinks.zipWithIndex.foreach { case (navlink, index) =>
      props.setProperty(s"$GlobalMenuNamePrefix$index", navlink.globalMenuName)
      props.setProperty(s"$GlobalMenuPathPrefix$index", navlink.globalMenuPath)
    }
    Using.resource(new java.io.FileOutputStream(NavLinkConf)) { out => props.store(out, null) }
  }

  def loadNavLinkSettings(): NavLinkSettings = {
    val props = new java.util.Properties()
    if (NavLinkConf.exists) {
      Using.resource(new java.io.FileInputStream(NavLinkConf)) { in => props.load(in) }
    }
    NavLinkSettings(loadNavLinks(props))
  }
}

object NavLinkSettingsService {

  case class NavLinkSettings(navLinks: Seq[NavLinkItem])
  case class NavLinkItem(globalMenuName: String, globalMenuPath: String)

  val MaxNavLinks = 5

  private val NavLinkCount = "navlink_count"
  private val GlobalMenuName = "global_menu_name"
  private val GlobalMenuPath = "global_menu_path"
  private val GlobalMenuNamePrefix = s"$GlobalMenuName."
  private val GlobalMenuPathPrefix = s"$GlobalMenuPath."

  def sanitize(navLinks: Seq[NavLinkItem]): Seq[NavLinkItem] = {
    navLinks
      .map(navLink => navLink.copy(globalMenuName = navLink.globalMenuName.trim, globalMenuPath = navLink.globalMenuPath.trim))
      .filter(navLink => navLink.globalMenuName.nonEmpty && navLink.globalMenuPath.nonEmpty)
      .take(MaxNavLinks)
  }

  private def loadNavLinks(props: java.util.Properties): Seq[NavLinkItem] = {
    val savedCount = Option(props.getProperty(NavLinkCount)).flatMap(v => Try(v.toInt).toOption).getOrElse(0)
    val navLinks =
      if (savedCount > 0) {
        (0 until math.min(savedCount, MaxNavLinks)).flatMap { index =>
          val name = Option(props.getProperty(s"$GlobalMenuNamePrefix$index")).map(_.trim).getOrElse("")
          val path = Option(props.getProperty(s"$GlobalMenuPathPrefix$index")).map(_.trim).getOrElse("")
          if (name.nonEmpty && path.nonEmpty) Some(NavLinkItem(name, path)) else None
        }
      } else {
        val name = Option(props.getProperty(GlobalMenuName)).map(_.trim).getOrElse("")
        val path = Option(props.getProperty(GlobalMenuPath)).map(_.trim).getOrElse("")
        if (name.nonEmpty && path.nonEmpty) Seq(NavLinkItem(name, path)) else Seq.empty
      }

    sanitize(navLinks)
  }
}
