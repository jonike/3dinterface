CONFIG_DEPENDENCY=$(MODULES)/config/build/.dirstamp
config: $(CONFIG_DEPENDENCY)

$(MODULES)/config/build/.dirstamp:  $(MODULES)/config/config.ts $(MODULES)/config/package.json $(MODULES)/config/tsconfig.json
	@$(call LOG_BUILDING,config)
	@$(CD) $(MODULES)/config/ && $(TSC)
	@$(TOUCH_DIRSTAMP)
	@$(call LOG_BUILT,config)

clean-config:
	@$(RMRF) \
		$(MODULES)/config/build \
		$(MODULES)/server/build/static/js/config.js \
		$(MODULES)/server/build/static/js/config.js.map
