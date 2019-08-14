#!/bin/bash

echo "Yhis script will perform few install and uninstall processes, it is NOT fully automated yet so please follow it and proceed with instructions on the screen. Press [RETURN] to begin ..."
read 

sudo pacman -S \
    yay

sudo pacman -R \
    palemoon-bin \
    epdfview

yay -S \
    bash-completion \
    arc-gtk-theme \
    nerd-fonts-fira-code \
    ttf-fira-sans \
    ttf-symbola \
    twemoji-color-font \
    google-chrome \
    zathura zathura-pdf-poppler zathura-cb zathura-djvu zathura-ps \ # pdf viewer
    python-pip \
    python-virtualenv \
    urxvt-resize-font-git \
    sxiv \ # image viewer
    i3blocks-git \
    xorg-xwininfo \
    sysstat \
    incron \
    xbanish-timeout-git \
    vifm


# yay -S pulseaudio pulseaudio-alsa pulsemixer

# incron setup
echo $USER | sudo tee /etc/incron.allow
sudo systemctl enable incrond.service

