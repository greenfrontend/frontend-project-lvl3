install:
	npm install

develop:
	webpack-dev-server --open

build:
	rm -rf dist
	NODE_ENV=production npx webpack

publish:
	npm publish

publish-test:
	npx eslint .
	npm publish --dry-run

lint:
	npx eslint .

test:
	npx jest
