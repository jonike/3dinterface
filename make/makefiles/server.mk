src/server/typings: src/server/typings/typings/.dirstamp src/server/typings/custom/.dirstamp

src/server/typings/typings/.dirstamp: src/server/typings/typings.json
	@$(call LOG_TYPINGS,server)
	@$(CD) src/server/typings && $(TYPINGS) install
	@$(TOUCH_DIRSTAMP)

src/server/typings/custom/.dirstamp: ./custom_typings/*
	@$(call LOG_CUSTOM,server)
	@$(MKDIRP) src/server/typings/custom/
	@$(MERGE) custom_typings src/server/typings/custom
	@$(TOUCH_DIRSTAMP)

src/server/node_modules/.dirstamp: src/server/package.json $(L3D_DEPENDENCY) $(L3DP_DEPENDENCY) $(CONFIG_DEPENDENCY) $(MTH_DEPENDENCY)
	@$(call LOG_DEPENDENCIES,server)
	@$(CD) src/server/ && $(NPM_UNINSTALL) l3d l3dp config mth && $(NPM_INSTALL)
	@$(TOUCH_DIRSTAMP)

src/server/build/.dirstamp: $(call FIND,src/server/src/,*.ts) $(call FIND,src/server/src,*.jade) src/server/node_modules/.dirstamp src/server/typings
	@$(call LOG_BUILDING,server)
	@$(CD) src/server/ && $(TSC)
	@$(TOUCH_DIRSTAMP)
	@$(call LOG_BUILT,server)

src/server/build/views/.dirstamp: src/server/src/views/*
	@$(ECHO) $(STYLE_PREPARE)Installing views of "server"$(COLOR_DEFAULT)
	@$(MKDIRP) src/server/build/views/
	@$(MERGE) src/server/src/views src/server/build/views
	@$(TOUCH_DIRSTAMP)

src/server/build/static/.dirstamp: static/*
	@$(ECHO) $(STYLE_PREPARE)Installing static files of "server"$(COLOR_DEFAULT)
	@$(MKDIRP) src/server/build/static/
	@$(MERGE) static/ src/server/build/static/
	@$(TOUCH_DIRSTAMP)

src/server/build/controllers/%/views: src/server/src/controllers/%/views
	@$(MKDIRP) $@
	@$(MERGE) $< $@
	@$(TOUCH_DIRSTAMP)

SRC_VIEWS=$(wildcard src/server/src/controllers/*/views)
OBJ_VIEWS=$(subst src/controllers/,build/controllers/,$(SRC_VIEWS))

views: $(OBJ_VIEWS)

src/server/build/static/js/l3d.js: ./src/l3d/build/.dirstamp src/l3d/frontend.config.js
	@$(CD) src/l3d/ && $(NODE) frontend.config.js

src/server/build/static/js/l3dp.js: ./src/l3dp/build/.dirstamp src/l3dp/frontend.config.js
	@$(CD) src/l3dp/ && $(NODE) frontend.config.js

src/server/build/static/js/config.js: ./src/config/build/.dirstamp src/config/config.js
	@$(CD) src/config/ && $(NODE) config.js

src/server/build/static/js/mth.js: ./src/mth/build/.dirstamp src/mth/config.js
	@$(CD) src/mth/ && $(NODE) config.js

server: src/server/build/.dirstamp src/server/build/views/.dirstamp src/server/build/static/.dirstamp $(OBJ_VIEWS) src/server/build/static/js/l3d.js src/server/build/static/js/l3dp.js src/server/build/static/js/config.js src/server/build/static/js/mth.js src/server/build/static/js/demo.js

test-server: server
	@$(CD) src/server/build/ && $(NODE) server.js --nolisten

run-server: server
	@$(CD) src/server/build && $(NODE) server.js

clean-server:
	@$(RMRF) \
		src/server/node_modules \
		src/server/typings/typings \
		src/server/typings/custom \
		src/server/build
