#!/bin/sh
# Profile file. Runs on login

export PATH="$PATH:$HOME/.local/bin:$( find $HOME/.scripts/ -type d -printf ":%p" )"
export TERMCMD="urxvt"
export EDITOR="vim"
export BROWSER="google-chrome-stable"
export FILE="ranger"
export READER="zathura"

# flag for opening google app mode
export GOOGLEAPPMODE=1

export QT_QPA_PLATFORMTHEME="qt5ct"
export GTK2_RC_FILES="$HOME/.gtkrc-2.0"
# fix "xdg-open fork-bomb" export your preferred browser from here

# prompting for password
export SUDO_ASKPASS=dmenuaskpass

# django
export POSTGRES_DB="netgurudb"
export POSTGRES_USER="norbert"
export POSTGRES_PASSWORD="wannabenetguru"
export SECRET_KEY="07d4cdfc3101fd99ab5211fbf7282c1fae54cd3055b0da2c"
export DEBUG_VALUE="True"
export OMDBAPIKEY="5401695a"

