include ./make/utils/define-cmd.mk

all: server bouncing-cube

./node_modules/.dirstamp:
	@$(ECHO) $(STYLE_PREPARE)Installing global dependencies$(COLOR_DEFAULT)
	@npm --loglevel error --progress false install typescript@next ts-loader webpack webpack-fail-plugin $(TO_NULL)
	@$(TOUCH_DIRSTAMP)

prepare: ./node_modules/.dirstamp

include ./make/include.mk

test: test-mth test-server

clean: clean-l3d clean-l3dp clean-server clean-demo clean-mth clean-bouncing-cube clean-config clean-global

clean-global:
	@$(RMRF) \
		./node_modules
