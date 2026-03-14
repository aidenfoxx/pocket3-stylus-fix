# GPD Pocket 3 Stylus Fix

By default, the stylus configuration for the GPD Pocket 3 on Linux is incorrectly rotated 90 degrees. This GNOME extension adds a Quick Settings toggle to rotate the display and correctly configure the stylus orientation.

This extension is provided as is, and may not be compatible with all distros.

## Installation

Run the following commands from the root of this repository to install the extension:

```bash
# Copy scripts and configs
sudo cp sudoers.d/update-rotation /etc/sudoers.d/
sudo cp libexec/update-rotation /usr/local/libexec/

# Fix permissions
sudo chmod 440 /etc/sudoers.d/update-rotation
sudo chmod 755 /usr/local/libexec/update-rotation

# Install GNOME extension
mkdir -p ~/.local/share/gnome-shell/extensions/
cp -r extension ~/.local/share/gnome-shell/extensions/pocket3-stylus-fix@aidenfoxx.github.com
```

Then restart GNOME Shell and enable the extension with [Extension Manager](https://flathub.org/en/apps/com.mattjakeman.ExtensionManager), or with the command: 

```bash
gnome-extensions enable pocket3-stylus-fix@aidenfoxx.github.com
```
