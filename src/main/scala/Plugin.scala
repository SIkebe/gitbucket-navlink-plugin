import com.github.sikebe.navlink.controller.NavLinkSettingsController
import com.github.sikebe.navlink.service.NavLinkSettingsService
import gitbucket.core.controller.Context
import gitbucket.core.plugin.Link
import io.github.gitbucket.solidbase.model.Version

class Plugin extends gitbucket.core.plugin.Plugin with NavLinkSettingsService {
  override val pluginId: String = "navlink"
  override val pluginName: String = "NavLink Plugin"
  override val description: String = "Adding NavLinks"
  override val versions: List[Version] = List(
    new Version("1.0.0"),
    new Version("1.0.1"),
    new Version("1.1.0"),
    new Version("1.2.0"),
    new Version("1.3.0")
  )

  override val controllers = Seq(
    "/*" -> new NavLinkSettingsController()
  )

  val navLinkSettings = loadNavLinkSettings()

  override val globalMenus =
    navLinkSettings.navLinks.zipWithIndex.map { case (navLink, index) =>
      (_: Context) => Some(Link(s"navlink-$index", navLink.globalMenuName, navLink.globalMenuPath))
    }

  override val systemSettingMenus = Seq((_: Context) => Some(Link("navlink", "NavLink", "navlink/settings")))

}
