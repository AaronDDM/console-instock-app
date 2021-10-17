.PHONY: build

install:
	npm --prefix stock-scanner ci

build:
	npm run --prefix stock-scanner build
	sam build

build-manual:
	npm run --prefix stock-scanner build:manual
	sam build

deploy:
	sam deploy

build_deploy: build deploy