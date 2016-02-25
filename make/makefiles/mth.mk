MTH_COMMONJS_DEPENDENCY=$(MODULES)/mth/lib/.dirstamp
mth: $(MTH_COMMONJS_DEPENDENCY)

$(MODULES)/mth/typings/.dirstamp: $(MODULES)/mth/typings.json
	@$(call LOG_TYPINGS,mth)
	@$(CD) $(MODULES)/mth/ && $(TYPINGS) install
	@$(TOUCH_DIRSTAMP)

$(MODULES)/mth/node_modules/.dirstamp: $(MODULES)/mth/package.json
	@$(call LOG_DEPENDENCIES,mth)
	@$(CD) $(MODULES)/mth/ && $(NPM_INSTALL)
	@$(TOUCH_DIRSTAMP)

$(MODULES)/mth/lib/.dirstamp: $(call FIND,$(MODULES)/mth/src/,*.ts) $(MODULES)/mth/package.json $(MODULES)/mth/tsconfig.json $(MODULES)/mth/typings/.dirstamp $(MODULES)/mth/node_modules/.dirstamp
	@$(call LOG_BUILDING,mth)
	@$(CD) $(MODULES)/mth/ && $(TSC)
	@$(TOUCH_DIRSTAMP)
	@$(call LOG_BUILT,mth)

test-mth: $(MTH_COMMONJS_DEPENDENCY)
	@$(NODEUNIT) $(MODULES)/mth/lib/$(MODULES)/tests/main.js

clean-mth:
	@$(RMRF) \
		$(MODULES)/mth/typings \
		$(MODULES)/mth/lib \
		$(MODULES)/mth/node_modules \
		$(MODULES)/server/lib/static/js/mth.js \
		$(MODULES)/server/lib/static/js/mth.js.map
