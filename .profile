#!/bin/sh
# Profile file. Runs on login

export PATH="$PATH:$HOME/.scripts"
export TERMCMD="urxvt"
export EDITOR="vim"
export BROWSER="google-chrome-stable"
export FILE="ranger"
export READER="zathura"

export QT_QPA_PLATFORMTHEME="qt5ct"
export GTK2_RC_FILES="$HOME/.gtkrc-2.0"
# fix "xdg-open fork-bomb" export your preferred browser from here
