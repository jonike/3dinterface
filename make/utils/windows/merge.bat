@echo off
set origin=%1%
set dest=%2%
set win_origin=%origin:$/=\%
set win_dest=%dest:$/=\%
copy $/E $/y %win_origin% %win_dest%
