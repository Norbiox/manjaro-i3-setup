#!/bin/bash

echo "Yhis script will perform few install and uninstall processes, it is NOT fully automated yet so please follow it and proceed with instructions on the screen. Press [RETURN] to begin ..."
read 

sudo pacman -S yay

sudo pacman -R palemoon-bin

yay -S google-chrome

yay -S zathura # pdf viewer
yay -R epdfview

yay -S pulseaudio pulseaudio-alsa pulsemixer

yay -S arc-gtk-theme
yay -S nerd-fonts-fira-code
yay -S ttf-fira-sans
