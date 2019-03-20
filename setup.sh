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
    zathura zathura-pdf-poppler zathura-cb zathura-djvu zathura-ps \
    arc-gtk-theme \
    nerd-fonts-fira-code \
    ttf-fira-sans \
    ttf-symbola \
    python-pip \
    python-virtualenv \
    urxvt-resize-font-git \
    sxiv


# yay -S pulseaudio pulseaudio-alsa pulsemixer
