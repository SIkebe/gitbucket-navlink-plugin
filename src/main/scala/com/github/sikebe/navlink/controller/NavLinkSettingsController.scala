package com.github.sikebe.navlink.controller

import gitbucket.core.controller.ControllerBase
import gitbucket.core.util.AdminAuthenticator
import org.scalatra.forms._
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

  val settingsForm: MappingValueType[NavLinkSettings] = mapping(
    "globalMenuName" -> text(required, maxlength(200)),
    "globalMenuPath" -> text(required, maxlength(200))
  )(NavLinkSettings.apply)

  get("/navlink/settings")(adminOnly {
    val settings = loadNavLinkSettings()
    html.settings(settings, isAdmin = true, flash.get("info"))
  })

  post("/navlink/settings", settingsForm)(adminOnly { form =>
    assert(form.globalMenuName != null)
    assert(!form.globalMenuName.isEmpty)
    assert(form.globalMenuPath != null)
    assert(!form.globalMenuPath.isEmpty)

    saveNavLinkSettings(form)
    reload(request.getServletContext(), loadSystemSettings(), request2Session(request).conn)
    flash += "info" -> "Successfully updated NavLink."
    redirect("/navlink/settings")
  })
}
