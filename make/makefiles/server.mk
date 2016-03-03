$(MODULES)$/server$/typings: $(MODULES)$/server$/typings$/typings$/.dirstamp $(MODULES)$/server$/typings$/custom$/.dirstamp

$(MODULES)$/server$/typings$/typings$/.dirstamp: $(MODULES)$/server$/typings$/typings.json
	@$(call LOG_TYPINGS,server)
	@$(CD) $(MODULES)$/server$/typings && $(TYPINGS) install
	@$(TOUCH_DIRSTAMP)

$(MODULES)$/server$/typings$/custom$/.dirstamp: .$/custom_typings$/*
	@$(call LOG_CUSTOM,server)
	@$(MKDIRP) $(MODULES)$/server$/typings$/custom$/
	@$(MERGE) custom_typings $(MODULES)$/server$/typings$/custom
	@$(TOUCH_DIRSTAMP)

$(MODULES)$/server$/node_modules$/.dirstamp: $(MODULES)$/server$/package.json $(L3D_DEPENDENCY) $(L3DP_DEPENDENCY) $(CONFIG_DEPENDENCY) $(MTH_DEPENDENCY)
	@$(call LOG_DEPENDENCIES,server)
	@$(CD) $(MODULES)$/server$/ && $(NPM_UNINSTALL) l3d l3dp config mth && $(NPM_INSTALL)
	@$(TOUCH_DIRSTAMP)

$(MODULES)$/server$/bin$/.dirstamp: $(call FIND,$(MODULES)$/server$/src$/,*.ts) $(call FIND,$(MODULES)$/server$/src,*.jade) $(MODULES)$/server$/node_modules$/.dirstamp $(MODULES)$/server$/typings
	@$(call LOG_BUILDING,server)
	@$(CD) $(MODULES)$/server$/ && $(TSC)
	@$(TOUCH_DIRSTAMP)
	@$(call LOG_BUILT,server)

$(MODULES)$/server$/bin$/views$/.dirstamp: $(MODULES)$/server$/src$/views$/*
	@$(ECHO) "$(STYLE_PREPARE)Installing views of \"server\"$(COLOR_DEFAULT)"
	@$(MKDIRP) $(MODULES)$/server$/bin$/views$/
	@$(MERGE) $(MODULES)$/server$/src$/views $(MODULES)$/server$/bin$/views
	@$(TOUCH_DIRSTAMP)

$(MODULES)$/server$/bin$/static$/.dirstamp: static$/*
	@$(ECHO) "$(STYLE_PREPARE)Installing static files of \"server\"$(COLOR_DEFAULT)"
	@$(MKDIRP) $(MODULES)$/server$/bin$/static$/
	@$(MERGE) static$/ $(MODULES)$/server$/bin$/static$/
	@$(TOUCH_DIRSTAMP)

$(MODULES)$/server$/bin$/controllers$/%$/views: $(MODULES)$/server$/src$/controllers$/%$/views
	@$(MKDIRP) $@
	@$(MERGE) $< $@
	@$(TOUCH_DIRSTAMP)

SRC_VIEWS=$(wildcard $(MODULES)$/server$/src$/controllers$/*$/views)
OBJ_VIEWS=$(subst src$/controllers$/,bin$/controllers$/,$(SRC_VIEWS))

views: $(OBJ_VIEWS)

$(MODULES)$/server$/bin$/generated$/.dirstamp:
	@$(MKDIRP) $(MODULES)$/server$/bin$/generated$/
	@$(MERGE) generated $(MODULES)$/server$/bin$/generated$/
	@$(TOUCH_DIRSTAMP)

server: $(MODULES)$/server$/bin$/.dirstamp $(MODULES)$/server$/bin$/views$/.dirstamp $(MODULES)$/server$/bin$/static$/.dirstamp $(OBJ_VIEWS) $(MODULES)$/server$/bin$/static$/js$/l3d.js $(MODULES)$/server$/bin$/static$/js$/l3dp.js $(MODULES)$/server$/bin$/static$/js$/config.js $(MODULES)$/server$/bin$/static$/js$/mth.js $(MODULES)$/server$/bin$/static$/js$/demo.js $(MODULES)$/server$/bin$/generated$/.dirstamp $(MODULES)$/server$/bin$/static$/js$/bouncing.min.js $(MODULES)$/server$/bin$/static$/js$/mth.js $(MODULES)$/server$/bin$/static$/js$/config.js $(MODULES)$/server$/bin$/static$/js$/demo.js $(MODULES)$/server$/bin$/static$/js$/l3d.js $(MODULES)$/server$/bin$/static$/js$/l3dp.js

# APPS
# CONFIG
$(MODULES)$/server$/bin$/static$/js$/config.js: $(MODULES)$/config$/bin$/config.js
	@$(MKDIRP) $(MODULES)$/server$/bin$/static$/js
	@$(MERGE) $(MODULES)$/config$/bin$/ $(MODULES)$/server$/bin$/static$/js

# BOUNCING-CUBE
$(MODULES)$/server$/bin$/static$/js$/bouncing.min.js: $(MODULES)$/bouncing-cube$/bin$/bouncing.min.js
	@$(MKDIRP) $(MODULES)$/server$/bin$/static$/js
	@$(MERGE) $(MODULES)$/bouncing-cube$/bin$/ $(MODULES)$/server$/bin$/static$/js

# MTH
$(MODULES)$/server$/bin$/static$/js$/mth.js: $(MODULES)$/mth$/bin$/mth.js
	@$(MKDIRP) $(MODULES)$/server$/bin$/static$/js
	@$(MERGE) $(MODULES)$/mth$/bin$/ $(MODULES)$/server$/bin$/static$/js

# DEMO
$(MODULES)$/server$/bin$/static$/js$/demo.js: $(MODULES)$/demo$/bin$/demo.js
	@$(MKDIRP) $(MODULES)$/server$/bin$/static$/js
	@$(MERGE) $(MODULES)$/demo$/bin$/ $(MODULES)$/server$/bin$/static$/js

# L3D
$(MODULES)$/server$/bin$/static$/js$/l3d.js: $(MODULES)$/l3d$/bin$/l3d.js
	@$(MKDIRP) $(MODULES)$/server$/bin$/static$/js
	@$(MERGE) $(MODULES)$/l3d$/bin$/ $(MODULES)$/server$/bin$/static$/js

# L3DP
$(MODULES)$/server$/bin$/static$/js$/l3dp.js: $(MODULES)$/l3dp$/bin$/l3dp.js
	@$(MKDIRP) $(MODULES)$/server$/bin$/static$/js
	@$(MERGE) $(MODULES)$/l3dp$/bin$/ $(MODULES)$/server$/bin$/static$/js

test-server: server
	@$(CD) $(MODULES)$/server$/bin$/ && $(NODE) server.js --nolisten

run-server: server
	@$(CD) $(MODULES)$/server$/bin && $(NODE_OUTPUT) server.js

clean-server:
	@$(RMRF) \
		$(MODULES)$/server$/node_modules \
		$(MODULES)$/server$/typings$/typings \
		$(MODULES)$/server$/typings$/custom \
		$(MODULES)$/server$/bin
