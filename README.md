# run-shared-scripts

<p align="center"><strong>run-shared-scripts</strong></p>
<p align="center">Define and run shared scripts of a monorepo using Yarn workspaces, Bolt, Lerna or pnpm</p>

<p align="center">
<a href="/LICENSE"><img src="https://img.shields.io/github/license/bubkoo/run-shared-scripts?style=flat-square" alt="MIT License"></a>
<a href="https://www.typescriptlang.org"><img alt="Language" src="https://img.shields.io/badge/language-TypeScript-blue.svg?style=flat-square"></a>
<a href="https://github.com/bubkoo/run-shared-scripts/pulls"><img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=flat-square"></a>
</p>

<p align="center">
<a href="https://github.com/bubkoo/run-shared-scripts/actions/workflows/release.yml"><img alt="build" src="https://img.shields.io/github/workflow/status/bubkoo/run-shared-scripts/%F0%9F%9A%80%E3%80%80Release/master?logo=github&style=flat-square"></a>
<a href="https://www.npmjs.com/package/run-shared-scripts"><img alt="NPM Package" src="https://img.shields.io/npm/v/run-shared-scripts.svg?style=flat-square"></a>
<a href="https://www.npmjs.com/package/run-shared-scripts"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/run-shared-scripts?logo=npm&style=flat-square"></a>
</p>

## Install
```shell
$ npm install --save-dev run-shared-scripts
```

## Usage

Using [npm-scripts](https://docs.npmjs.com/misc/scripts) is a convenient way to our CI/CD tasks, and we may have some similar `"scripts"` in a monorepo. Take the following monorepo for example.

```
.
├── lerna.json
├── package.json
└── packages
    ├── project-a
    │   ├── index.js
    │   ├── node_modules
    │   └── package.json
    ├── project-b
    │   ├── index.js
    │   ├── node_module
    │   └── package.json
    ...
```

The `"scripts"` property defined in `./packages/project-a/package.json` and `./packages/project-b/package.json` is similar.

```json
  "scripts": {
    "clean:build": "rimraf dist lib es",
    "clean:coverage": "rimraf ./test/coverage",
    "clean": "run-p clean:build clean:coverage",
    "build:esm": "tsc --module esnext --target es2015 --outDir ./es",
    "build:cjs": "tsc --module commonjs --target es5 --outDir ./lib",
    "build:umd": "rollup -c",
    "build:style": "../../scripts/build-style.js",
    "build": "run-p build:style build:cjs build:esm build:umd",
    "prebuild": "run-s lint clean",
    "test": "jest",
    "coveralls": "cat ./test/coverage/lcov.info | coveralls",
    "pretest": "run-p clean:coverage",
    "prepare": "yarn build"
  }
```

### Basic Usage

Then we can use `run-shared-scripts` to define and run these similar `"scripts"`.

1. Add `rss` config in the monorepo root's `./package.json` file.
```json
  "rss": {
    "clean:build": "rimraf dist lib es",
    "clean:coverage": "rimraf ./test/coverage",
    "clean": "run-p clean:build clean:coverage",
    "build:esm": "tsc --module esnext --target es2015 --outDir ./es",
    "build:cjs": "tsc --module commonjs --target es5 --outDir ./lib",
    "build:umd": "rollup -c",
    "build:style": { "file": "./scripts/build-style.js" },
    "build": "run-p build:style build:cjs build:esm build:umd",
    "prebuild": "run-s lint clean",
    "test": "jest",
    "coveralls": "cat ./test/coverage/lcov.info | coveralls",
    "pretest": "run-p clean:coverage",
    "prepare": "yarn build"
  }
```

**Note that** the `"build:style"` command define the task to run an executable file. The executable file path must be an absolute path or a path relative the monorepo's root directory.

2. Replace with `rss` command in `./packages/project-a/package.json` and `./packages/project-b/package.json`.

```json
  "scripts": {
    "clean:build": "rss",
    "clean:coverage": "rss",
    "clean": "rss",
    "build:esm": "rss",
    "build:cjs": "rss",
    "build:umd": "rss",
    "build:style": "rss",
    "build": "rss",
    "prebuild": "rss",
    "test": "rss",
    "coveralls": "rss",
    "pretest": "rss",
    "prepare": "rss"
  }
```

### Run specified task

The `rss` command run the same named(the key of `"scripts"`) task by default. We can pass a task name to specify the task to run.

```json
  "scripts": {
    "clean": "rss clean:build" // will run "clean:build" task defined in the "rss" config
  }
```

### Run with arguments

Any arguments following `--` will pass to task.

```json
  "scripts": {
    "test": "rss -- --watch" // run jest in watch mode
  }
```

## Contributing

Please let us know how can we help. Do check out [issues](https://github.com/bubkoo/run-shared-scripts/issues) for bug reports or suggestions first.

To become a contributor, please follow our [contributing guide](/CONTRIBUTING.md).

<!-- <a href="https://github.com/bubkoo/run-shared-scripts/graphs/contributors">
  <img src="/CONTRIBUTORS.svg" alt="Contributors" width="740" />
</a> -->


## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
