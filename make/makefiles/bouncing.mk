$(MODULES)/bouncing-cube/typings: $(MODULES)/bouncing-cube/typings/typings/.dirstamp $(MODULES)/bouncing-cube/typings/custom/.dirstamp

$(MODULES)/bouncing-cube/typings/typings/.dirstamp: $(PREPARE_DEPENDENCY) $(MODULES)/bouncing-cube/typings/typings.json
	@$(call LOG_TYPINGS,bouncing-cube)
	@$(CD) $(MODULES)/bouncing-cube/typings && $(TYPINGS) install
	@$(TOUCH_DIRSTAMP)

$(MODULES)/bouncing-cube/typings/custom/.dirstamp: $(PREPARE_DEPENDENCY) $(CUSTOM_TYPINGS_SRC)
	@$(call LOG_CUSTOM,bouncing-cube)
	@$(MKDIRP) $(MODULES)/bouncing-cube/typings/custom/
	@$(MERGE) custom_typings $(MODULES)/bouncing-cube/typings/custom
	@$(TOUCH_DIRSTAMP)

$(MODULES)/bouncing-cube/node_modules/.dirstamp: $(PREPARE_DEPENDENCY) $(MODULES)/bouncing-cube/package.json $(L3D_DEPENDENCY)
	@$(call LOG_DEPENDENCIES,bouncing-cube)
	@$(CD) $(MODULES)/bouncing-cube/ && $(NPM_INSTALL)
	@$(TOUCH_DIRSTAMP)

$(MODULES)/bouncing-cube/bin/bouncing.min.js: $(PREPARE_DEPENDENCY) $(call FIND,$(MODULES)/bouncing-cube/src/,*) $(MODULES)/bouncing-cube/node_modules/.dirstamp $(MODULES)/bouncing-cube/tsconfig.json $(MODULES)/bouncing-cube/typings $(MODULES)/bouncing-cube/config.js
	@$(call LOG_BUILDING,bouncing-cube)
	@$(CD) $(MODULES)/bouncing-cube/ && $(NODE) config.js
	@$(call LOG_BUILT,bouncing-cube)

BOUNCING_CUBE_DEPENDENCY=$(MODULES)/bouncing-cube/bin/bouncing.min.js
bouncing-cube: $(BOUNCING_CUBE_DEPENDENCY)

clean-bouncing-cube:
	@$(RMRF) \
		$(MODULES)/bouncing-cube/lib \
		$(MODULES)/bouncing-cube/bin \
		$(MODULES)/bouncing-cube/node_modules \
		$(MODULES)/bouncing-cube/typings/custom \
		$(MODULES)/bouncing-cube/typings/typings
