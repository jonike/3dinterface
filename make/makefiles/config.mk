CONFIG_DEPENDENCY=$(MODULES)/config/lib/.dirstamp
config: $(CONFIG_DEPENDENCY)

$(MODULES)/config/lib/.dirstamp:  $(MODULES)/config/config.ts $(MODULES)/config/package.json $(MODULES)/config/tsconfig.json
	@$(call LOG_BUILDING,config)
	@$(CD) $(MODULES)/config/ && $(TSC)
	@$(TOUCH_DIRSTAMP)
	@$(call LOG_BUILT,config)

clean-config:
	@$(RMRF) \
		$(MODULES)/config/lib \
		$(MODULES)/server/lib/static/js/config.js \
		$(MODULES)/server/lib/static/js/config.js.map
