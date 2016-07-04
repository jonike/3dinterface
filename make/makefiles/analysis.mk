$(MODULES)/analysis/node_modules/.dirstamp: $(PREPARE_DEPENDENCY) $(MODULES)/analysis/package.json
	@$(call LOG_DEPENDENCIES,analysis)
	@$(CD) $(MODULES)/analysis/ && $(NPM_INSTALL)
	@$(TOUCH_DIRSTAMP)

$(MODULES)/analysis/typings/.dirstamp: $(PREPARE_DEPENDENCY) $(MODULES)/analysis/typings.json
	@$(call LOG_TYPINGS,analysis)
	@$(CD) $(MODULES)/analysis/ && $(TYPINGS) install
	@$(TOUCH_DIRSTAMP)

ANALYSIS_RECO_DEPENDENCY=$(MODULES)/analysis/bin/reco/main.js
analysis_reco: $(ANALYSIS_RECO_DEPENDENCY)

$(MODULES)/analysis/bin/reco/main.js: $(PREPARE_DEPENDENCY) $(MODULES)/analysis/typings/.dirstamp $(MODULES)/analysis/node_modules/.dirstamp
	@$(call LOG_BUILDING,analysis_reco)
	@$(CD) $(MODULES)/analysis/src/reco && $(TSC)

clean-analysis:
	@$(RMRF) \
		$(MODULES)/analysis/bin \
		$(MODULES)/analysis/node_modules \
		$(MODULES)/analysis/typings

analysis: analysis_reco
