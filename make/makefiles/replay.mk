DEMO_DEPENDENCY=$(MODULES)/replay/bin/replay.js
replay: $(DEMO_DEPENDENCY)

$(MODULES)/replay/typings/typings/.dirstamp: $(PREPARE_DEPENDENCY) $(MODULES)/replay/typings/typings.json
	@$(call LOG_TYPINGS,replay)
	@$(CD) $(MODULES)/replay/typings/ && $(TYPINGS) install
	@$(TOUCH_DIRSTAMP)

$(MODULES)/replay/typings/custom/.dirstamp: $(CUSTOM_TYPINGS_SRC)
	@$(call LOG_CUSTOM,replay)
	@$(MKDIRP) $(MODULES)/replay/typings/custom
	@$(MERGE) ./custom_typings $(MODULES)/replay/typings/custom
	@$(TOUCH_DIRSTAMP)

$(MODULES)/replay/typings/.dirstamp: $(PREPARE_DEPENDENCY) $(MODULES)/replay/typings/typings/.dirstamp $(MODULES)/replay/typings/custom/.dirstamp
	@$(TOUCH_DIRSTAMP)

$(MODULES)/replay/node_modules/.dirstamp: $(MODULES)/replay/package.json $(L3D_DEPENDENCY) $(L3DP_DEPENDENCY) $(CONFIG_DEPENDENCY)
	@$(call LOG_DEPENDENCIES,replay)
	@$(CD) $(MODULES)/replay/ && $(NPM_UNINSTALL) config l3d l3dp && $(NPM_INSTALL)
	@$(TOUCH_DIRSTAMP)

$(MODULES)/replay/bin/replay.js: $(PREPARE_DEPENDENCY) $(MODULES)/replay/main.ts $(MODULES)/replay/node_modules/.dirstamp $(MODULES)/replay/tsconfig.json $(MODULES)/replay/typings/.dirstamp $(MODULES)/replay/config.js $(MODULES)/l3d/bin/l3d.js $(MODULES)/l3dp/bin/l3dp.js $(MODULES)/mth/bin/mth.js
	@$(call LOG_BUILDING,replay)
	@$(NODE) $(MODULES)/replay/config.js
	@$(call LOG_BUILT,replay)

clean-replay:
	@$(RMRF) \
		$(MODULES)/replay/node_modules \
		$(MODULES)/replay/lib \
		$(MODULES)/replay/bin \
		$(MODULES)/replay/typings/typings \
		$(MODULES)/replay/typings/custom
