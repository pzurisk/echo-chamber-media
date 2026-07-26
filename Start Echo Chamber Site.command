#!/bin/zsh
# Starts the Echo Chamber Media website on this Mac (the Chad),
# reachable from any Mac on your home network (like your Studio Mac upstairs).
# Just double-click this file. Leave the window open while you work.
# To stop the site: press Control + C in this window, or just close it.

cd "$(dirname "$0")"

# Make sure node/npm are on PATH no matter how they were installed
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.npm-global/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"

clear
echo "============================================================"
echo "  ECHO CHAMBER MEDIA  ::  starting your website..."
echo "============================================================"
echo ""
echo "  When you see 'Ready' below, open the site from any Mac"
echo "  on your network (including the Studio Mac upstairs):"
echo ""
echo "     http://barrys-Mac-mini.local:3000"
echo "     http://192.168.0.195:3000"
echo ""
echo "  Keep this window open while you work. Press Control + C to stop."
echo "============================================================"
echo ""

npm run dev -- -H 0.0.0.0
