ifeq ($(OS),Windows_NT)
	include ./make/utils/define-windows-cmd.mk
else
	include ./make/utils/define-linux-cmd.mk
endif

NODE=node>$(DEVNULL)
NODE_OUTPUT=node
NPM_INSTALL=npm install --loglevel error --progress false>$(DEVNULL)
NPM_UNINSTALL=npm uninstall --loglevel error --progress false>$(DEVNULL)
TSC=tsc
TYPINGS=typings>$(DEVNULL)
NODEUNIT=nodeunit>$(DEVNULL)
TO_NULL=> $(DEVNULL)
CD=cd
LOG_TYPINGS=$(ECHO) $(STYLE_PREPARE)Installing typings of \"$1\"$(COLOR_DEFAULT)
LOG_CUSTOM=$(ECHO) $(STYLE_PREPARE)Installing custom typings of \"$1\"$(COLOR_DEFAULT)
LOG_DEPENDENCIES=$(ECHO) $(STYLE_PREPARE)Installing dependencies of \"$1\"$(COLOR_DEFAULT)
LOG_BUILDING=$(ECHO) $(STYLE_BUILD)Building TS module \"$1\"$(COLOR_DEFAULT)
LOG_BUILT=$(ECHO) Built module \"$1\"

