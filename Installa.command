#!/bin/bash
cd "$(dirname "$0")"
D="$HOME/Agenda"
P="$HOME/Library/LaunchAgents/com.agenda.app.plist"
mkdir -p "$D" "$HOME/Library/LaunchAgents"
cp server.py public/index.html "$D/"
cp "Riavvia Agenda.command" Disinstalla.command "$D/" 2>/dev/null
chmod +x "$D"/*.command 2>/dev/null
cat > "$P" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>com.agenda.app</string>
<key>ProgramArguments</key><array><string>/usr/bin/python3</string><string>$D/server.py</string></array>
<key>WorkingDirectory</key><string>$D</string>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><true/>
</dict></plist>
PLIST
launchctl bootout "gui/$(id -u)" "$P" 2>/dev/null
launchctl bootstrap "gui/$(id -u)" "$P"
sleep 2
open http://localhost:8765
echo "Fatto! Agenda è attiva e partirà da sola a ogni accensione. Puoi chiudere questa finestra."
