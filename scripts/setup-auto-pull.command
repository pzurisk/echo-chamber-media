#!/bin/zsh
# ONE-TIME SETUP. Run this on the Mac mini (the Chad) only.
# Double-click this file once. It installs a background job that checks GitHub
# every 2 minutes and updates the site automatically. You can close the window
# when it says Done. To undo later, run: launchctl unload ~/Library/LaunchAgents/com.echochamber.autopull.plist

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/com.echochamber.autopull.plist"

clear
echo "============================================================"
echo "  ECHO CHAMBER MEDIA  ::  installing auto-update"
echo "============================================================"
echo ""
echo "  Repo: $REPO"
echo ""

chmod +x "$SCRIPT_DIR/auto-pull.sh"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.echochamber.autopull</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/zsh</string>
        <string>$SCRIPT_DIR/auto-pull.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>120</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$REPO/.auto-pull.log</string>
    <key>StandardErrorPath</key>
    <string>$REPO/.auto-pull.log</string>
</dict>
</plist>
EOF

launchctl unload "$PLIST" 2>/dev/null
launchctl load -w "$PLIST"

echo "  Done. The site will now update within about 2 minutes of any push."
echo "  Activity is logged to: $REPO/.auto-pull.log"
echo ""
echo "  You can close this window."
echo "============================================================"
