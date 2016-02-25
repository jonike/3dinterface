CUSTOM_TYPINGS_SRC=$(wildcard custom_typings/*) $(wildcard custom_typings/*/*)

include ./make/utils/define-path.mk

include ./make/makefiles/config.mk
include ./make/makefiles/mth.mk
include ./make/makefiles/l3d.mk
include ./make/makefiles/l3dp.mk
include ./make/makefiles/bouncing.mk
include ./make/makefiles/server.mk
include ./make/makefiles/demo.mk
