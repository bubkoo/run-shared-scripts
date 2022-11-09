#!/usr/bin/env node

const args = process.argv.slice(2)

console.log(`run test ${args.length ? `with args ${args}` : ''}`)
