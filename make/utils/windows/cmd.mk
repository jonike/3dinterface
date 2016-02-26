MERGE=make\utils\windows\merge
TOUCH_DIRSTAMP=copy /b $@+,,
MKDIRP=make\utils\windows\mkdirp
RMRF=rd /s /q
DEVNULL=NUL
ECHO=echo
FIND=$(shell dir /s /b $1\$2)
