import os from 'os'
import fse from 'fs-extra'
import path from 'path'
import crypto from 'crypto'
import chalk from 'chalk'
import { quote } from 'shell-quote'
import { closest } from 'fastest-levenshtein'
import { findMonorepoRoot } from 'find-monorepo-root'
import { spawn } from './spawn.js'

async function ensureTargetDir(root) {
  const nodeModules = path.join(root, 'node_modules')
  const tmpdir = await fse.pathExists(nodeModules) ? nodeModules : os.tmpdir()
  const targetDir = path.join(tmpdir, '.rss')
  const exist = await fse.pathExists(targetDir)
  if (!exist) {
    await fse.mkdirp(targetDir)
  }
  return targetDir
}

function makeExecMain(cmd, args) {
  const usedPos = []
  const defaults = []
  const main = cmd
    // collect default values
    .replace(/\{([1-9]\d?)=([^}]+)}/g, (whole, id, defaultValue) => {
      const pos = id - 1
      defaults[pos] = defaultValue
      return `{${id}}`
    })
    // replace placeholder
    .replace(/\{([*@]|[1-9]\d?)}/g, (whole, id) => {
      if (id === "@" || id === '*') {
        usedPos.push(...args.map((_, i) => i))
        return id === '@' ? quote(args) : quote([args.join(' ')])
      }


      const pos = id - 1
      if (pos >= 0 && pos < args.length) {
        usedPos.push(pos)

        const arg = args[pos]
        if (arg && arg.trim()) {
          return quote([arg])
        }
      }

      if (defaults[pos] != null) {
        return quote([defaults[pos]])
      }

      return ''
    })

  const others = args.filter((_, i) => !usedPos.includes(i))
  return `${main} ${quote(others)}`
}

async function makeExecFile(root, task, main) {
  const targetDir = await ensureTargetDir(root)

  const win32 = process.platform === 'win32'
  const ext = win32 ? '.cmd' : ''
  const name = task.toLowerCase().replace(/[^0-9a-z]/g, '-')

  let exist
  let filePath
  do {
    const hash = crypto.randomBytes(16).toString('hex')
    const filename = `${name}-${hash}${ext}`
    filePath = path.join(targetDir, filename)
    exist = await fse.pathExists(filePath)
  } while (exist)


  const declare = win32 ? '@ECHO OFF' : '#!/usr/bin/env sh'

  await fse.writeFile(filePath, `${declare}\n\n${main}`)
  await fse.chmod(filePath, 0o777)

  return filePath
}

const rootCache = {}
async function findRoot() {
  const cwd = process.cwd()
  let root = rootCache[cwd]
  if (root) {
    return root
  }

  const { dir } = await findMonorepoRoot(cwd)
  rootCache[cwd] = dir
  return dir
}

function fixFilePath(root, file) {
  if (path.isAbsolute(file)) {
    return file
  }
  return path.resolve(root, file)
}

export async function run(task, args, options) {
  const root = await findRoot()
  const pkg = await fse.readJSON(path.join(root, 'package.json'))
  const cmd = pkg.rss[task]

  if (cmd) {
    const isFile = typeof cmd === 'object' && cmd.file != null
    const main = isFile ? cmd.file : makeExecMain(cmd, args)

    let log = '> '
    const eventColor = closest(task, [
      'green',
      'yellow',
      'blue',
      'magenta',
      'cyan',
      'red',
    ])
    log += chalk[eventColor](`[${task}]`)
    log += ' '
    log += main
    console.log(log)

    if (!options.dryRun) {
      const exe = isFile
        ? fixFilePath(root, main)
        : await makeExecFile(root, task, main)

      const child = spawn(exe, isFile ? args : [], { stdio: 'inherit' })

      if (!isFile) {
        child.on('exit', () => { fse.rm(exe) })
      }
    }
  } else {
    console.error(`unknown script: [${task}]`)
  }
}
