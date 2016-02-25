L3D_DEPENDENCY=$(MODULES)/l3d/lib/.dirstamp
l3d: $(L3D_DEPENDENCY)

$(MODULES)/l3d/typings: $(MODULES)/l3d/typings/typings/.dirstamp $(MODULES)/l3d/typings/custom/.dirstamp

$(MODULES)/l3d/typings/typings/.dirstamp: $(MODULES)/l3d/typings/typings.json
	@$(call LOG_TYPINGS,l3d)
	@$(CD) $(MODULES)/l3d/typings && $(TYPINGS) install
	@$(TOUCH_DIRSTAMP)

$(MODULES)/l3d/typings/custom/.dirstamp: $(CUSTOM_TYPINGS_SRC)
	@$(call LOG_CUSTOM,l3d)
	@$(MKDIRP) $(MODULES)/l3d/typings/custom/
	@$(MERGE) ./custom_typings $(MODULES)/l3d/typings/custom
	@$(TOUCH_DIRSTAMP)

$(MODULES)/l3d/node_modules/.dirstamp: $(MODULES)/l3d/package.json $(MTH_COMMONJS_DEPENDENCY)
	@$(call LOG_DEPENDENCIES,l3d)
	@$(CD) $(MODULES)/l3d/ && $(NPM_UNINSTALL) mth && $(NPM_INSTALL)
	@$(TOUCH_DIRSTAMP)

$(MODULES)/l3d/lib/.dirstamp: $(call FIND,$(MODULES)/l3d/src/,*) $(MODULES)/l3d/node_modules/.dirstamp $(MODULES)/l3d/tsconfig-backend.json $(MODULES)/l3d/backend.config.js $(MODULES)/l3d/typings/typings/.dirstamp $(MODULES)/l3d/typings/custom/.dirstamp
	@$(call LOG_BUILDING,l3d)
	@$(NODE) $(MODULES)/l3d/backend.config.js
	@$(TOUCH_DIRSTAMP)
	@$(call LOG_BUILT,l3d)

clean-l3d:
	@$(RMRF) \
		$(MODULES)/l3d/lib \
		$(MODULES)/l3d/node_modules \
		$(MODULES)/l3d/typings/typings \
		$(MODULES)/l3d/typings/custom \
		$(MODULES)/server/lib/static/js/l3d.js \
		$(MODULES)/server/lib/static/js/l3d.js.map
