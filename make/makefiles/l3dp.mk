L3DP_DEPENDENCY=$(MODULES)$/l3dp$/lib$/.dirstamp
l3dp: $(L3DP_DEPENDENCY)

$(MODULES)$/l3dp$/typings: $(MODULES)$/l3dp$/typings$/typings$/.dirstamp $(MODULES)$/l3dp$/typings$/custom$/.dirstamp

$(MODULES)$/l3dp$/typings$/typings$/.dirstamp: $(PREPARE_DEPENDENCY) $(MODULES)$/l3dp$/typings$/typings.json
	@$(call LOG_TYPINGS,l3dp)
	@$(CD) $(MODULES)$/l3dp$/typings && $(TYPINGS) install
	@$(TOUCH_DIRSTAMP)

$(MODULES)$/l3dp$/typings$/custom$/.dirstamp: $(CUSTOM_TYPINGS_SRC)
	@$(call LOG_CUSTOM,l3dp)
	@$(MKDIRP) $(MODULES)$/l3dp$/typings$/custom$/
	@$(MERGE) custom_typings $(MODULES)$/l3dp$/typings$/custom
	@$(TOUCH_DIRSTAMP)

$(MODULES)$/l3dp$/node_modules$/.dirstamp: $(MODULES)$/l3dp$/package.json $(L3D_DEPENDENCY) $(CONFIG_DEPENDENCY) $(MTH_COMMONJS_DEPENDENCY)
	@$(call LOG_DEPENDENCIES,l3dp)
	@$(CD) $(MODULES)$/l3dp$/ && $(NPM_UNINSTALL) config l3d mth && $(NPM_INSTALL)
	@$(TOUCH_DIRSTAMP)

$(MODULES)$/l3dp$/lib$/.dirstamp: $(PREPARE_DEPENDENCY) $(call FIND,$(MODULES)$/l3dp$/src$/,*) $(MODULES)$/l3dp$/node_modules$/.dirstamp $(MODULES)$/l3dp$/tsconfig-backend.json $(MODULES)$/l3dp$/backend.config.js $(MODULES)$/l3dp$/typings
	@$(call LOG_BUILDING,l3dp)
	@$(NODE) $(MODULES)$/l3dp$/backend.config.js
	@$(TOUCH_DIRSTAMP)
	@$(call LOG_BUILT,l3dp)

$(MODULES)$/l3dp$/bin$/l3dp.js: $(PREPARE_DEPENDENCY) $(call FIND,$(MODULES)$/l3dp$/src$/,*) $(MODULES)$/l3dp$/node_modules$/.dirstamp $(MODULES)$/l3dp$/tsconfig-backend.json $(MODULES)$/l3dp$/backend.config.js $(MODULES)$/l3dp$/typings
	@$(CD) $(MODULES)$/l3dp$/ && $(NODE) frontend.config.js

clean-l3dp:
	@$(RMRF) \
		$(MODULES)$/l3dp$/lib \
		$(MODULES)$/l3dp$/bin \
		$(MODULES)$/l3dp$/node_modules \
		$(MODULES)$/l3dp$/typings$/typings \
		$(MODULES)$/l3dp$/typings$/custom
