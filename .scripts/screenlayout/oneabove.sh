#!/bin/sh
xrandr \
    --output LVDS1 --primary --mode 1600x900 --pos 160x1080 --rotate normal \
    --output VGA1 --mode 1920x1080 --pos 0x0 --rotate normal
