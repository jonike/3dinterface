CONFIG_DEPENDENCY=$(MODULES)/config/lib/.dirstamp
config: $(CONFIG_DEPENDENCY)

$(MODULES)/config/lib/.dirstamp: $(PREPARE_DEPENDENCY) $(MODULES)/config/config.ts $(MODULES)/config/package.json $(MODULES)/config/tsconfig.json
	@$(call LOG_BUILDING,config)
	@$(CD) $(MODULES)/config/ && $(TSC)
	@$(TOUCH_DIRSTAMP)
	@$(call LOG_BUILT,config)

$(MODULES)/config/bin/config.js: $(PREPARE_DEPENDENCY) $(MODULES)/config/config.ts $(MODULES)/config/package.json $(MODULES)/config/tsconfig.json
	@$(CD) $(MODULES)/config/ && $(NODE) config.js


clean-config:
	@$(RMRF) \
		$(MODULES)/config/lib \
		$(MODULES)/config/bin
