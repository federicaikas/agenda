#!/bin/bash
P="$HOME/Library/LaunchAgents/com.agenda.app.plist"
launchctl bootout "gui/$(id -u)" "$P" 2>/dev/null
rm -f "$P"
echo "Agenda disattivata. I tuoi dati restano nella cartella Agenda in Home. Puoi chiudere questa finestra."
