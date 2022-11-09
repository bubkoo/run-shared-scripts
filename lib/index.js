import os from 'os'
import fse from 'fs-extra'
import path from 'path'
import crypto from 'crypto'
import chalk from 'chalk'
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

async function uniqueFilePath(targetDir, name, ext) {
  let exist
  let file
  do {
    const hash = crypto.randomBytes(16).toString('hex')
    file = path.join(targetDir, `${name}-${hash}`, ext)
    exist = await fse.pathExists(file)
  } while (exist)
  return file
}

async function makeExecFile(root, task, cmd, args) {
  const win32 = process.platform === 'win32'
  const ext = win32 ? '.cmd' : ''
  const define = win32 ? '@ECHO OFF' : '#!/usr/bin/env sh'
  const name = task.toLowerCase().replace(/[^0-9a-z]/g, '-')

  const targetDir = await ensureTargetDir(root)
  const filePath = await uniqueFilePath(targetDir, name, ext)
  const main = args.length ? `${cmd} ${args.join(' ')}` : cmd

  await fse.writeFile(filePath, `${define}\n\n${main}`)
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
    log += isFile ? cmd.file : `${cmd}`
    console.log(log)

    if (!options.dryRun) {
      const exe = isFile
        ? fixFilePath(root, cmd.file)
        : await makeExecFile(root, task, cmd, args)

      const child = spawn(exe, isFile ? args : [], { stdio: 'inherit' })

      if (!isFile) {
        child.on('exit', () => { fse.rmSync(exe) })
      }
    }
  } else {
    console.error(`unknown script: [${task}]`)
  }
}
