#!/bin/bash
# Puts the StoreKit configuration onto the scheme's TEST action.
#
# XcodeGen 2.46 writes storeKitConfiguration only for the run action, so every
# `xcodegen generate` drops it from the test action. Without it, the UI test in
# EchoMealUITests launches the app with no local products, PaywallView finds
# `product == nil`, and the screenshot it captures shows a disabled Subscribe
# button under "Loading the subscription from the App Store." Run this right
# after xcodegen and before xcodebuild test.
#
# Idempotent. Running it twice is a no-op.
#
# Done in python rather than sed on purpose: the insert has to land inside one
# specific XML element, and an escaped multi-line sed replacement for that is
# write-only and failed silently the first time it was tried here.
set -euo pipefail

cd "$(dirname "$0")/.."
SCHEME="EchoMeal.xcodeproj/xcshareddata/xcschemes/EchoMeal.xcscheme"

if [ ! -f "$SCHEME" ]; then
  echo "no scheme at $SCHEME. Run xcodegen generate first." >&2
  exit 1
fi

SCHEME="$SCHEME" /usr/bin/python3 - <<'PY'
import os, sys

path = os.environ["SCHEME"]
text = open(path).read()

close = "   </TestAction>"
start = text.index("   <TestAction")
end = text.index(close, start)

if "StoreKitConfigurationFileReference" in text[start:end]:
    print("test action already has the StoreKit configuration, nothing to do")
    sys.exit(0)

# The identifier is relative to the scheme file, two levels inside the project
# bundle. Same value the run action already carries.
block = (
    '      <StoreKitConfigurationFileReference\n'
    '         identifier = "../../MealTime.storekit">\n'
    '      </StoreKitConfigurationFileReference>\n'
)

open(path, "w").write(text[:end] + block + text[end:])
print("patched: test action now loads MealTime.storekit")
PY

if awk '/<TestAction/,/<\/TestAction>/' "$SCHEME" | grep -q StoreKitConfigurationFileReference; then
  exit 0
else
  echo "patch failed, the test action still has no StoreKit configuration" >&2
  exit 1
fi
