#!/bin/bash
launchctl kickstart -k "gui/$(id -u)/com.agenda.app"
sleep 2
open http://localhost:8765
echo "Fatto! Agenda riavviata. Puoi chiudere questa finestra."
