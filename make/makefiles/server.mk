$(MODULES)/server/typings: $(MODULES)/server/typings/typings/.dirstamp $(MODULES)/server/typings/custom/.dirstamp

$(MODULES)/server/typings/typings/.dirstamp: $(MODULES)/server/typings/typings.json
	@$(call LOG_TYPINGS,server)
	@$(CD) $(MODULES)/server/typings && $(TYPINGS) install
	@$(TOUCH_DIRSTAMP)

$(MODULES)/server/typings/custom/.dirstamp: ./custom_typings/*
	@$(call LOG_CUSTOM,server)
	@$(MKDIRP) $(MODULES)/server/typings/custom/
	@$(MERGE) custom_typings $(MODULES)/server/typings/custom
	@$(TOUCH_DIRSTAMP)

$(MODULES)/server/node_modules/.dirstamp: $(MODULES)/server/package.json $(L3D_DEPENDENCY) $(L3DP_DEPENDENCY) $(CONFIG_DEPENDENCY) $(MTH_DEPENDENCY)
	@$(call LOG_DEPENDENCIES,server)
	@$(CD) $(MODULES)/server/ && $(NPM_UNINSTALL) l3d l3dp config mth && $(NPM_INSTALL)
	@$(TOUCH_DIRSTAMP)

$(MODULES)/server/lib/.dirstamp: $(call FIND,$(MODULES)/server/src/,*.ts) $(call FIND,$(MODULES)/server/src,*.jade) $(MODULES)/server/node_modules/.dirstamp $(MODULES)/server/typings
	@$(call LOG_BUILDING,server)
	@$(CD) $(MODULES)/server/ && $(TSC)
	@$(TOUCH_DIRSTAMP)
	@$(call LOG_BUILT,server)

$(MODULES)/server/lib/views/.dirstamp: $(MODULES)/server/src/views/*
	@$(ECHO) $(STYLE_PREPARE)Installing views of "server"$(COLOR_DEFAULT)
	@$(MKDIRP) $(MODULES)/server/lib/views/
	@$(MERGE) $(MODULES)/server/src/views $(MODULES)/server/lib/views
	@$(TOUCH_DIRSTAMP)

$(MODULES)/server/lib/static/.dirstamp: static/*
	@$(ECHO) $(STYLE_PREPARE)Installing static files of "server"$(COLOR_DEFAULT)
	@$(MKDIRP) $(MODULES)/server/lib/static/
	@$(MERGE) static/ $(MODULES)/server/lib/static/
	@$(TOUCH_DIRSTAMP)

$(MODULES)/server/lib/controllers/%/views: $(MODULES)/server/src/controllers/%/views
	@$(MKDIRP) $@
	@$(MERGE) $< $@
	@$(TOUCH_DIRSTAMP)

SRC_VIEWS=$(wildcard $(MODULES)/server/src/controllers/*/views)
OBJ_VIEWS=$(subst $(MODULES)/controllers/,lib/controllers/,$(SRC_VIEWS))

views: $(OBJ_VIEWS)

$(MODULES)/server/lib/static/js/l3d.js: ./$(MODULES)/l3d/lib/.dirstamp $(MODULES)/l3d/frontend.config.js
	@$(CD) $(MODULES)/l3d/ && $(NODE) frontend.config.js

$(MODULES)/server/lib/static/js/l3dp.js: ./$(MODULES)/l3dp/lib/.dirstamp $(MODULES)/l3dp/frontend.config.js
	@$(CD) $(MODULES)/l3dp/ && $(NODE) frontend.config.js

$(MODULES)/server/lib/static/js/config.js: ./$(MODULES)/config/lib/.dirstamp $(MODULES)/config/config.js
	@$(CD) $(MODULES)/config/ && $(NODE) config.js

$(MODULES)/server/lib/static/js/mth.js: ./$(MODULES)/mth/lib/.dirstamp $(MODULES)/mth/config.js
	@$(CD) $(MODULES)/mth/ && $(NODE) config.js

$(MODULES)/server/lib/generated/.dirstamp:
	@$(MKDIRP) $(MODULES)/server/lib/generated/
	@$(MERGE) generated $(MODULES)/server/lib/generated/
	@$(TOUCH_DIRSTAMP)

server: $(MODULES)/server/lib/.dirstamp $(MODULES)/server/lib/views/.dirstamp $(MODULES)/server/lib/static/.dirstamp $(OBJ_VIEWS) $(MODULES)/server/lib/static/js/l3d.js $(MODULES)/server/lib/static/js/l3dp.js $(MODULES)/server/lib/static/js/config.js $(MODULES)/server/lib/static/js/mth.js $(MODULES)/server/lib/static/js/demo.js $(MODULES)/server/lib/generated/.dirstamp

test-server: server
	@$(CD) $(MODULES)/server/lib/ && $(NODE) server.js --nolisten

run-server: server
	@$(CD) $(MODULES)/server/lib && $(NODE) server.js

clean-server:
	@$(RMRF) \
		$(MODULES)/server/node_modules \
		$(MODULES)/server/typings/typings \
		$(MODULES)/server/typings/custom \
		$(MODULES)/server/lib
