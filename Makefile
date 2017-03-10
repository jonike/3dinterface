# Define primordial commands

ifeq ($(OS),Windows_NT)
	/=\\
else
	/=/
endif

include .$/make$/utils$/define-cmd.mk

all: server bouncing-cube analysis

PREPARE_DEPENDENCY=.$/node_modules$/.dirstamp

$(PREPARE_DEPENDENCY):
	@$(ECHO) "$(STYLE_PREPARE)Installing global dependencies$(COLOR_DEFAULT)"
	@npm --loglevel error --progress false install typescript ts-loader webpack webpack-fail-plugin $(TO_NULL)
	@$(TOUCH_DIRSTAMP)

prepare: $(PREPARE_DEPENDENCY)

include .$/make$/include.mk

test: test-mth test-server

clean: clean-global clean-l3d clean-l3dp clean-server clean-demo clean-mth clean-bouncing-cube clean-config clean-analysis clean-replay

clean-global:
	@$(RMRF) \
		.$/node_modules
