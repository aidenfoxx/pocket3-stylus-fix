import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as QuickSettings from "resource:///org/gnome/shell/ui/quickSettings.js";

import GObject from "gi://GObject";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

const SCREEN_NAME = "DSI-1";

const SCRIPT_PATH = "/usr/local/libexec/update-rotation";

const TRANSFORM_LANDSCAPE = 0;
const TRANSFORM_PORTRAIT = 1;

const MATRIX_LANDSCAPE = "0 1 0 -1 0 1";
const MATRIX_PORTRAIT = "1 0 0 0 1 0";

const DisplayConfigInterface = `<node>
  <interface name='org.gnome.Mutter.DisplayConfig'>
    <method name="GetCurrentState">
      <arg name="serial" direction="out" type="u" />
      <arg name="monitors" direction="out" type="a((ssss)a(siiddada{sv})a{sv})" />
      <arg name="logical_monitors" direction="out" type="a(iiduba(ssss)a{sv})" />
      <arg name="properties" direction="out" type="a{sv}" />
    </method>
    <method name="ApplyMonitorsConfig">
      <arg name="serial" direction="in" type="u" />
      <arg name="method" direction="in" type="u" />
      <arg name="logical_monitors" direction="in" type="a(iiduba(ssa{sv}))" />
      <arg name="properties" direction="in" type="a{sv}" />
    </method>
  </interface>
</node>`;

const RotateToggle = GObject.registerClass(
  class RotateToggle extends QuickSettings.QuickToggle {
    _init() {
      super._init({
        title: _("Rotate Screen"),
        iconName: "object-rotate-right-symbolic",
        toggleMode: true,
      });

      const proxyWrapper = Gio.DBusProxy.makeProxyWrapper(DisplayConfigInterface);
      proxyWrapper(
        Gio.DBus.session,
        "org.gnome.Mutter.DisplayConfig",
        "/org/gnome/Mutter/DisplayConfig",
        (proxy, error) => {
          if (error) {
            console.error(`Failed to initialize proxy: ${error.message}`);
            return;
          }
          this._proxy = proxy;
        }
      );

      this.connect("clicked", () => this._setRotation(this.checked));
    }

    destroy() {
      this._proxy = null;
      super.destroy();
    }

    _setRotation(portrait) {
      this._proxy?.GetCurrentStateRemote((res, error) => {
        if (error) {
          console.error(`Failed to get display state: ${error.message}`);
          return;
        }

        const [serial, physicalMonitors, logicalMonitors] = res;
        const targetRotation = portrait ? TRANSFORM_PORTRAIT : TRANSFORM_LANDSCAPE;

        const updatedLogical = logicalMonitors.map((lm) => {
          let [x, y, scale, transform, primary, attached] = lm;

          const isBuiltin = attached.some((mon) => mon[0] === SCREEN_NAME);
          if (isBuiltin) {
            transform = targetRotation;
          }

          const monitorList = attached.map((a) => {
            const connector = a[0];
            const phys = physicalMonitors.find((p) => p[0][0] === connector);
            const modeId = phys[1].find((m) => m[6]?.["is-current"])?.[0] ?? phys[1][0][0];
            return [connector, modeId, {}];
          });

          return [x, y, scale, transform, primary, monitorList];
        });

        try {
          GLib.spawn_command_line_async(`sudo -n ${SCRIPT_PATH} ${portrait ? MATRIX_PORTRAIT : MATRIX_LANDSCAPE}`);
          this._proxy.ApplyMonitorsConfigRemote(serial, 1, updatedLogical, {});
        } catch (e) {
          console.error(`Failed to update rotation: ${e.message}`);
        }
      });
    }
  }
);

export default class Extension {
  enable() {
    this._toggle = new RotateToggle();
    this._indicator = new QuickSettings.SystemIndicator();
    this._indicator.quickSettingsItems.push(this._toggle);

    Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
  }

  disable() {
    this._indicator?.destroy();
    this._toggle?.destroy();
    this._indicator = null;
    this._toggle = null;
  }
}
