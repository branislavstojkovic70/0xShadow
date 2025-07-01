.PHONY: localnet deploy

compile:
	npx hardhat compile

localnet:
	npx hardhat node

deploy: compile
	npx hardhat deploy-shadow --network localhost

fund:
	@if [ -z "$(address)" ]; then \
		echo "Usage: make fund address=0xYourAddress"; \
		exit 1; \
	fi
	@AMOUNT_HEX=0x3635C9ADC5DEA00000 && \
	echo "Funding address $(address) with 1000 ETH..." && \
	curl --silent --location --request POST http://127.0.0.1:8545 \
	  --header "Content-Type: application/json" \
	  --data-raw "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"hardhat_setBalance\",\"params\":[\"$(address)\",\"$$AMOUNT_HEX\"]}" && \
	echo