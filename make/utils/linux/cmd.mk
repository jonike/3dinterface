MERGE=sh -c 'cp -r $$0/* $$1'
TOUCH_DIRSTAMP=touch $@
MKDIRP=mkdir -p
RMRF=rm -rf
DEVNULL=/dev/null

COLOR_DEFAULT="\\033[0m"
COLOR_GREEN="\\033[32m"
STYLE_BOLD="\\033[1m"
STYLE_PREPARE=$(COLOR_GREEN)
STYLE_BUILD=$(COLOR_GREEN)$(STYLE_BOLD)

ECHO=printf "%b\n"

FIND=$(shell find $1 -name "$2")
