@echo off
set input=%1%
set win_dirname=%input:/=\%
if not exist "%win_dirname%" mkdir %win_dirname%
