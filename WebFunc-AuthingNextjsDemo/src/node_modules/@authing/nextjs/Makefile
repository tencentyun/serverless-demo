.PHONY: clean build test install example
all: build

clean:
	rm -rf `find packages -name yarn.lock`
	rm -rf `find . -name package-lock.json`
	rm -rf `find . -name dist`
	rm -rf `find . -name node_modules`

install:
	yarn install

build:
	yarn run build

test:
	yarn test:cov

example:
	rm -rf `find ./examples -name node_modules`
	yarn build
	cd ./examples/basic && yarn && yarn dev
