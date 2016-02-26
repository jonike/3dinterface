DEMO_DEPENDENCY=$(MODULES)/server/lib/static/js/demo.js
demo: $(DEMO_DEPENDENCY)

$(MODULES)/demo/typings/typings/.dirstamp: $(MODULES)/demo/typings/typings.json
	@$(call LOG_TYPINGS,demo)
	@$(CD) $(MODULES)/demo/typings/ && $(TYPINGS) install
	@$(TOUCH_DIRSTAMP)

$(MODULES)/demo/typings/custom/.dirstamp: $(CUSTOM_TYPINGS_SRC)
	@$(call LOG_CUSTOM,demo)
	@$(MKDIRP) $(MODULES)/demo/typings/custom
	@$(MERGE) ./custom_typings $(MODULES)/demo/typings/custom
	@$(TOUCH_DIRSTAMP)

$(MODULES)/demo/typings/.dirstamp: $(MODULES)/demo/typings/typings/.dirstamp $(MODULES)/demo/typings/custom/.dirstamp
	@$(TOUCH_DIRSTAMP)

$(MODULES)/demo/node_modules/.dirstamp: $(MODULES)/demo/package.json $(L3D_DEPENDENCY) $(L3DP_DEPENDENCY) $(CONFIG_DEPENDENCY)
	@$(call LOG_DEPENDENCIES,demo)
	@$(CD) $(MODULES)/demo/ && $(NPM_UNINSTALL) config l3d l3dp && $(NPM_INSTALL)
	@$(TOUCH_DIRSTAMP)

$(MODULES)/demo/bin/demo.js: $(MODULES)/demo/main.ts $(MODULES)/demo/node_modules/.dirstamp $(MODULES)/demo/tsconfig.json $(MODULES)/demo/typings/.dirstamp $(MODULES)/demo/config.js $(MODULES)/server/lib/static/js/l3d.js $(MODULES)/server/lib/static/js/l3dp.js $(MODULES)/server/lib/static/js/mth.js
	@$(call LOG_BUILDING,demo)
	@$(NODE) $(MODULES)/demo/config.js
	@$(call LOG_BUILT,demo)

clean-demo:
	@$(RMRF) \
		$(MODULES)/demo/node_modules \
		$(MODULES)/demo/lib \
		$(MODULES)/demo/bin \
		$(MODULES)/demo/typings/typings \
		$(MODULES)/demo/typings/custom \
		$(MODULES)/server/lib/static/js/demo.js \
		$(MODULES)/server/lib/static/js/demo.js.map
