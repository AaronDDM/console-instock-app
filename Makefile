.PHONY: build

build:
	npm run --prefix stock-scanner build
	sam build

deploy:
	sam deploy

build_deploy: build deploy