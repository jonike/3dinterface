$(MODULES)/bouncing-cube/typings: $(MODULES)/bouncing-cube/typings/typings/.dirstamp $(MODULES)/bouncing-cube/typings/custom/.dirstamp

$(MODULES)/bouncing-cube/typings/typings/.dirstamp: $(MODULES)/bouncing-cube/typings/typings.json
	@$(call LOG_TYPINGS,bouncing-cube)
	@$(CD) $(MODULES)/bouncing-cube/typings && $(TYPINGS) install
	@$(TOUCH_DIRSTAMP)

$(MODULES)/bouncing-cube/typings/custom/.dirstamp: $(CUSTOM_TYPINGS_SRC)
	@$(call LOG_CUSTOM,bouncing-cube)
	@$(MKDIRP) $(MODULES)/bouncing-cube/typings/custom/
	@$(MERGE) custom_typings $(MODULES)/bouncing-cube/typings/custom
	@$(TOUCH_DIRSTAMP)

$(MODULES)/bouncing-cube/node_modules/.dirstamp: $(MODULES)/bouncing-cube/package.json $(L3D_DEPENDENCY)
	@$(call LOG_DEPENDENCIES,bouncing-cube)
	@$(CD) $(MODULES)/bouncing-cube/ && $(NPM_UNINSTALL) l3d && $(NPM_INSTALL)
	@$(TOUCH_DIRSTAMP)

$(MODULES)/server/build/static/js/bouncing.min.js: $(call FIND,$(MODULES)/bouncing-cube/src/,*) $(MODULES)/bouncing-cube/node_modules/.dirstamp $(MODULES)/bouncing-cube/tsconfig.json $(MODULES)/bouncing-cube/typings $(MODULES)/bouncing-cube/config.js
	@$(call LOG_BUILDING,bouncing-cube)
	@$(NODE) $(MODULES)/bouncing-cube/config.js
	@$(call LOG_BUILT,bouncing-cube)

BOUNCING_CUBE_DEPENDENCY=$(MODULES)/server/build/static/js/bouncing.min.js
bouncing-cube: $(BOUNCING_CUBE_DEPENDENCY)

clean-bouncing-cube:
	@$(RMRF) \
		$(MODULES)/bouncing-cube/build \
		$(MODULES)/bouncing-cube/node_modules \
		$(MODULES)/bouncing-cube/typings/custom \
		$(MODULES)/bouncing-cube/typings/typings \
		$(MODULES)/server/build/static/js/bouncing.min.js \
		$(MODULES)/server/build/static/js/bouncing.min.js.map
