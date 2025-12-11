package com.github.sikebe.navlink.controller

import gitbucket.core.controller.ControllerBase
import gitbucket.core.util.AdminAuthenticator
import sikebe.gitbucket.navlink.html
import com.github.sikebe.navlink.service.NavLinkSettingsService
import com.github.sikebe.navlink.service.NavLinkSettingsService._
import gitbucket.core.plugin.PluginRegistry._
import gitbucket.core.util.Implicits._

class NavLinkSettingsController
    extends NavLinkSettingsControllerBase
    with NavLinkSettingsService
    with AdminAuthenticator

trait NavLinkSettingsControllerBase extends ControllerBase {
  self: NavLinkSettingsService with AdminAuthenticator =>

  get("/navlink/settings")(adminOnly {
    val settings = loadNavLinkSettings()
    html.settings(settings.navLinks, MaxNavLinks, isAdmin = true, flash.get("info"))
  })

  post("/navlink/settings")(adminOnly {
    val navLinks = (0 until MaxNavLinks).map { index =>
      NavLinkItem(
        params.getOrElse(s"navlinks[$index].globalMenuName", ""),
        params.getOrElse(s"navlinks[$index].globalMenuPath", "")
      )
    }
    val sanitized = sanitize(navLinks)
    saveNavLinkSettings(NavLinkSettings(sanitized))
    reload(request.getServletContext(), loadSystemSettings(), request2Session(request).conn)
    flash.update("info", s"Successfully updated NavLink (up to $MaxNavLinks links).")
    redirect("/navlink/settings")
  })
}
