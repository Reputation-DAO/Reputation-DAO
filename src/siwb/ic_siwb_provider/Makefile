build:
	cd ../../; \
	dfx canister create --all; \
	dfx build ic_siwb_provider; \
	cd target/wasm32-unknown-unknown/release/; \
	ic-wasm ic_siwb_provider.wasm -o ic_siwb_provider.wasm metadata candid:service -f ../../../packages/ic_siwb_provider/ic_siwb_provider.did -v public; \
	gzip --no-name --force "ic_siwb_provider.wasm"; \
	cp ic_siwb_provider.wasm.gz ../../../packages/ic_siwb_provider/; \

test:
	@{ \
	  make -f ../test_canister/Makefile build; \
		export POCKET_IC_BIN=../../pocket-ic; \
		export IC_SIWB_PROVIDER_PATH=../../target/wasm32-unknown-unknown/release/ic_siwb_provider.wasm.gz; \
		export TEST_CANISTER_PATH=../../target/wasm32-unknown-unknown/release/test_canister.wasm.gz; \
		$(MAKE) build; \
		cargo test --test integration_tests -- --nocapture; \
	}

clean:
	cargo clean