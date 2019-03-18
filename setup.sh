#!/bin/bash

echo "Yhis script will perform few install and uninstall processes, it is NOT fully automated yet so please follow it and proceed with instructions on the screen. Press [RETURN] to begin ..."
read 

sudo pacman -S \
    yay

sudo pacman -R \
    palemoon-bin \
    epdfview

yay -S \
    google-chrome \
    zathura \
    arc-gtk-theme \
    nerd-fonts-fira-code \
    tff-fira-sans \
    python-pip \
    python-virtualenv
    urxvt-resize-font-git

# yay -S pulseaudio pulseaudio-alsa pulsemixer
