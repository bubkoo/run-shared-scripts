#!/usr/bin/env node

import meow from 'meow'
import { run } from '../lib/index.js'

const inputs = process.argv.slice(2)
const split = inputs.indexOf('--')
const argv = split >= 0 ? inputs.slice(0, split) : inputs
const args = split >= 0 ? inputs.slice(split + 1) : []

const cli = meow(
  `
  Usage
    $ rss [task] [options] [-- args]

    Run shared script with optional task name.

  Options
    --dry-run ·········· Set the flag to run task in dry-run mode.
    --version ·········· Show version info.
    --help ············· Show help info.

  Examples
    $ rss build
    $ rss build --dry-run
    $ rss build --dry-run -- -w
`,
  {
    flags: {
      dryRun: {
        type: 'boolean',
        default: false,
      },
    },
    argv,
    importMeta: import.meta,
    allowUnknownFlags: true,
    version: true,
  },
)

const cmd = cli.input[0] || process.env.npm_lifecycle_event

run(cmd, args, cli.flags)
