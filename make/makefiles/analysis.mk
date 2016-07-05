$(MODULES)/analysis/node_modules/.dirstamp: $(PREPARE_DEPENDENCY) $(MODULES)/analysis/package.json $(L3D_DEPENDENCY) $(L3DP_DEPENDENCY) $(CONFIG_DEPENDENCY)
	@$(call LOG_DEPENDENCIES,analysis)
	@$(CD) $(MODULES)/analysis/ && $(NPM_UNINSTALL) l3d l3dp config && $(NPM_INSTALL)
	@$(TOUCH_DIRSTAMP)

$(MODULES)/analysis/typings/typings/.dirstamp: $(PREPARE_DEPENDENCY) $(MODULES)/analysis/typings/typings.json
	@$(call LOG_TYPINGS,analysis)
	@$(CD) $(MODULES)/analysis/typings/ && $(TYPINGS) install
	@$(TOUCH_DIRSTAMP)

$(MODULES)/analysis/typings/custom/.dirstamp: $(CUSTOM_TYPINGS_SRC)
	@$(call LOG_CUSTOM,analysis)
	@$(MKDIRP) $(MODULES)/analysis/typings/custom
	@$(MERGE) ./custom_typings $(MODULES)/analysis/typings/custom
	@$(TOUCH_DIRSTAMP)

$(MODULES)/analysis/bin/.dirstamp: $(PREPARE_DEPENDENCY) $(MODULES)/analysis/typings/typings/.dirstamp $(MODULES)/analysis/node_modules/.dirstamp $(MODULES)/analysis/typings/custom/.dirstamp $(call FIND,$(MODULES)/analysis/src/,*.ts)
	@$(call LOG_BUILDING,analysis)
	@$(CD) $(MODULES)/analysis/ && $(TSC)
	@$(TOUCH_DIRSTAMP)

clean-analysis:
	@$(RMRF) \
		$(MODULES)/analysis/bin \
		$(MODULES)/analysis/node_modules \
		$(MODULES)/analysis/typings/custom \
		$(MODULES)/analysis/typings/typings \

analysis: $(MODULES)/analysis/bin/.dirstamp
