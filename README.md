<p align="center"><strong>run-shared-scripts</strong></p>
<p align="center">Define and run shared scripts of a monorepo using Yarn workspaces, Bolt, Lerna or pnpm</p>

<p align="center">
<a href="/LICENSE"><img src="https://img.shields.io/github/license/bubkoo/run-shared-scripts?style=flat-square" alt="MIT License"></a>
<a href="https://www.typescriptlang.org"><img alt="Language" src="https://img.shields.io/badge/language-TypeScript-blue.svg?style=flat-square"></a>
<a href="https://github.com/bubkoo/run-shared-scripts/pulls"><img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=flat-square"></a>
</p>

<p align="center">
<a href="https://github.com/bubkoo/run-shared-scripts/actions/workflows/ci.yml"><img alt="build" src="https://img.shields.io/github/workflow/status/bubkoo/run-shared-scripts/%F0%9F%91%B7%E3%80%80CI/master?logo=github&style=flat-square"></a>
<a href="https://www.npmjs.com/package/run-shared-scripts"><img alt="NPM Package" src="https://img.shields.io/npm/v/run-shared-scripts.svg?style=flat-square"></a>
<a href="https://www.npmjs.com/package/run-shared-scripts"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/run-shared-scripts?logo=npm&style=flat-square"></a>
</p>

## Install
```shell
$ npm install --save-dev run-shared-scripts
```

## Usage

Using [npm-scripts](https://docs.npmjs.com/misc/scripts) is a convenient way to run our CI/CD tasks, and we may have some similar `"scripts"` in a monorepo workspaces. Take the following monorepo for example.

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

The `"scripts"` defined in `./packages/project-a/package.json` and `./packages/project-b/package.json` is similar.

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
    "build:style": {
      "file": "./scripts/build-style.js" // path relative to monorepo's root directory
    },
    "build": "run-p build:style build:cjs build:esm build:umd",
    "prebuild": "run-s lint clean",
    "test": "jest",
    "coveralls": "cat ./test/coverage/lcov.info | coveralls",
    "pretest": "run-p clean:coverage",
    "prepare": "yarn build"
  }
```

**Note that** the `"build:style"` command define the task to run an executable file. The executable file path must be an absolute path or a path relative the monorepo's root directory.

1. Replace with `rss` command in `./packages/project-a/package.json` and `./packages/project-b/package.json`.

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

Arguments before `--` separator are `rss` command args.

```json
  "scripts": {
    "test": "rss --dry-run" // run in dry-run model
  }
```

Arguments after  `--` separator will pass to task.

```json
  "scripts": {
    "test": "rss -- --watch" // will run "jest --watch"
  }
```

### Argument placeholders

We can use placeholders to define the `"rss"` scripts.

- `{1}`, `{2}`, ... -- An argument. `{1}` is the 1st argument. `{2}` is the 2nd.
- `{@}` -- All arguments.
- `{*}` -- All arguments as combined.
- `{n=defaultValue}` -- An argument with default value. `n` is the n-th argument.

```json
  "rss": {
    "s1": "server --port {1}",
    "s2": "server -a {1} --port {2}",
    "s3": "server {@}",
    "s4": "server {*}",
    "s5": "server --port {1=8080}",
    "s6": "server --port1 {1=8080} --port2 {1}",
    "s7": "server -a {1=0.0.0.0} --port {2=8080}"
  }
```

Then pass your args in the `"scripts"`.

```json
  "scripts": {
    "s1": "rss -- 8080",         // => "server --port 8080"
    "s2": "rss -- 0.0.0.0 8080", // => "server -a 0.0.0.0 --port 8080"
    "s3": "rss -- -a 0.0.0.0 --port 8080", // => "server -a 0.0.0.0 --port 8080"
    "s4": "rss -- -a 0.0.0.0 --port 8080", // => "server '-a 0.0.0.0 --port 8080'"
    "s5-1": "rss s5",         // => "server --port 8080"
    "s5-2": "rss s5 -- 9090", // => "server --port 9090"
    "s6-1": "rss s6",         // => "server --port1 8080 --port2 8080"
    "s6-1": "rss s6 -- 9090", // => "server --port1 9090 --port2 9090"
    "s7-1": "rss s7",                    // => "server -a 0.0.0.0 --port 8080"
    "s7-2": "rss s7 -- '' 9090",         // => "server -a 0.0.0.0 --port 9090"
    "s7-3": "rss s7 -- 127.0.0.1 9090",  // => "server -a 127.0.0.1 --port 9090"
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
