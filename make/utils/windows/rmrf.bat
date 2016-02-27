@echo off
set origin=%1%
set win_origin=%origin:$/=\%
rd $/s $/q %win_origin%
