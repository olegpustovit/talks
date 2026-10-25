# Ruby -> (Spinel) -> C -> (zig cc) -> static Linux binary -> AWS Lambda.
#
#   make build     compile src/handler.rb into build/bootstrap and zip it
#   make deploy    create/update role, function, public Function URL; write endpoint.json
#   make smoke     curl the URL (alias: make invoke)
#   make cold      force a fresh execution environment, then curl
#   make logs      recent REPORT lines (Init Duration = cold start)
#   make status    function config + URL
#   make teardown  delete everything deploy created (idempotent)
#   make local     run the host build against scripts/fake_runtime.rb

PROFILE  ?= rubyzg-talk
REGION   ?= eu-central-1
ARCH     ?= arm64
FUNCTION ?= rubyzg-spinel-demo
MEMORY   ?= 1769
ROLE     ?= $(FUNCTION)-role
AWS      ?= /opt/homebrew/bin/aws
ZIG      ?= zig

# Spinel is built from source (no gem). Pinned to the commit this demo was built with.
SPINEL_REPO ?= https://github.com/matz/spinel
SPINEL_REV  ?= 0e7b469de6948268aed3986628dc4830df01bbcc
SPINEL_DIR  := vendor/spinel
SPINEL      := $(SPINEL_DIR)/bin/spinel

ifeq ($(ARCH),arm64)
  ZIG_TARGET := aarch64-linux-musl
else ifeq ($(ARCH),x86_64)
  ZIG_TARGET := x86_64-linux-musl
else
  $(error ARCH must be arm64 or x86_64)
endif

SHELL  := /bin/bash
B      := build
GEN    := $(B)/gen
OBJ    := $(B)/obj-$(ARCH)
XCC    := $(ZIG) cc -target $(ZIG_TARGET)
# Same flags spinel passes to the host cc (see `spinel --cc=<wrapper>`), minus Apple-only ones.
XFLAGS := -O2 -w -ffunction-sections -fdata-sections -ffp-contract=off -DSP_INT_OVERFLOW_MODE_RAISE

# Spinel runtime (lib/libspinel_rt.a members, Makefile RT_MEMBERS) + regexp engine + the json package's C.
RT_MEMBERS := sp_bigint sp_crypto sp_pack sp_time sp_core sp_net sp_system sp_gc sp_slab sp_alloc \
  sp_dtoa sp_marshal sp_format sp_string sp_inspect sp_poly_cold sp_array sp_str sp_str_cold \
  sp_str_crypt sp_hash sp_proc sp_exc sp_re sp_random sp_fiber sp_sched sp_io sp_iobuffer sp_cold \
  sp_enum_str sp_process sp_process_status
RE_MEMBERS := re_compile re_exec re_utf8 unicase re_spinel
RT_OBJS := $(addprefix $(OBJ)/rt/,$(addsuffix .o,$(RT_MEMBERS))) \
           $(addprefix $(OBJ)/re/,$(addsuffix .o,$(RE_MEMBERS))) \
           $(OBJ)/pkg/sp_json.o

.PHONY: build spinel local deploy smoke invoke cold logs status teardown clean
.DEFAULT_GOAL := build

# ---- the compiler ------------------------------------------------------------

spinel: $(SPINEL)
$(SPINEL):
	@if [ ! -d $(SPINEL_DIR)/.git ]; then git clone $(SPINEL_REPO) $(SPINEL_DIR); fi
	cd $(SPINEL_DIR) && git checkout -q $(SPINEL_REV) && $(MAKE) deps && $(MAKE)

# ---- Ruby -> C ---------------------------------------------------------------

# handler.rb is copied next to two generated files it require_relative's:
#   source.rb      SOURCE = <handler.rb text>, for the page's "View source"
#   build_info.rb  compiler/target facts shown on the page
$(GEN)/handler.rb: src/handler.rb $(SPINEL)
	@mkdir -p $(GEN)
	cp src/handler.rb $@
	ruby -e 'puts "SOURCE = " + File.read(ARGV[0]).inspect' src/handler.rb > $(GEN)/source.rb
	{ echo "BUILD_TARGET = \"$(ZIG_TARGET) (static)\""; \
	  echo "BUILD_ARCH = \"$(ARCH)\""; \
	  echo "BUILD_SPINEL = $$(ruby -e 'print ARGV.join(" ").sub(/^spinel /, "").sub(/ \[.*\]$$/, "").inspect' $$($(SPINEL) --version))"; \
	  echo "BUILD_CC = \"zig cc $$($(ZIG) version)\""; } > $(GEN)/build_info.rb

$(GEN)/handler.c: $(GEN)/handler.rb
	$(SPINEL) $(GEN)/handler.rb -c -o $@

# ---- C -> Linux (cross) --------------------------------------------------------

$(OBJ)/rt/%.o: $(SPINEL_DIR)/lib/%.c | $(SPINEL)
	@mkdir -p $(@D)
	$(XCC) -c $(XFLAGS) -I$(SPINEL_DIR)/lib -I$(SPINEL_DIR)/lib/regexp -I$(SPINEL_DIR)/lib/regexp/shim $< -o $@
$(OBJ)/re/%.o: $(SPINEL_DIR)/lib/regexp/%.c | $(SPINEL)
	@mkdir -p $(@D)
	$(XCC) -c $(XFLAGS) -I$(SPINEL_DIR)/lib/regexp -I$(SPINEL_DIR)/lib/regexp/shim $< -o $@
$(OBJ)/pkg/sp_json.o: $(SPINEL_DIR)/packages/json/sp_json.c | $(SPINEL)
	@mkdir -p $(@D)
	$(XCC) -c $(XFLAGS) -I$(SPINEL_DIR)/lib -I$(SPINEL_DIR)/packages/json $< -o $@

$(B)/bootstrap: $(GEN)/handler.c $(RT_OBJS)
	$(XCC) $(XFLAGS) -I$(SPINEL_DIR)/lib -I$(SPINEL_DIR)/lib/regexp $(GEN)/handler.c $(RT_OBJS) \
	  -lm -static -Wl,--gc-sections -s -o $@
	@file $@
	@ls -l $@ | awk '{print "bootstrap: " $$5 " bytes"}'

$(B)/function.zip: $(B)/bootstrap
	rm -f $@
	cd $(B) && chmod 755 bootstrap && zip -q -X function.zip bootstrap
	@ls -l $@ | awk '{print "function.zip: " $$5 " bytes"}'

build: $(B)/function.zip

# ---- local run (host build, fake Runtime API) ---------------------------------

local: $(GEN)/handler.rb
	$(SPINEL) $(GEN)/handler.rb -o $(B)/bootstrap-host
	@mkdir -p $(B)/local
	ruby scripts/fake_runtime.rb 9311 3 $(B)/local & \
	  sleep 0.5; AWS_LAMBDA_RUNTIME_API=127.0.0.1:9311 AWS_REGION=local $(B)/bootstrap-host || true
	@ls $(B)/local

# ---- AWS ---------------------------------------------------------------------

export PROFILE REGION ARCH FUNCTION MEMORY ROLE AWS

deploy: $(B)/function.zip
	scripts/deploy.sh $(B)/function.zip

smoke invoke:
	scripts/smoke.sh

cold:
	scripts/cold.sh

logs:
	scripts/logs.sh

status:
	-$(AWS) --profile $(PROFILE) --region $(REGION) lambda get-function-configuration --function-name $(FUNCTION) \
	  --query '{state:State,update:LastUpdateStatus,runtime:Runtime,arch:Architectures[0],memory:MemorySize,codeSize:CodeSize,modified:LastModified}' --output table
	-$(AWS) --profile $(PROFILE) --region $(REGION) lambda get-function-url-config --function-name $(FUNCTION) \
	  --query '{url:FunctionUrl,auth:AuthType}' --output table
	@cat endpoint.json 2>/dev/null || true

teardown:
	scripts/teardown.sh

clean:
	rm -rf $(B)
