import fs from 'fs'
import path from 'path'
import { terser } from 'rollup-plugin-terser'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import filesize from 'rollup-plugin-filesize'
import typescript from '@rollup/plugin-typescript'

function makeOutput() {
  const cwd = process.cwd()
  const pkg = JSON.parse(
    fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'),
  )
  return { name: pkg.name }
}

export function config(config) {
  let { plugins = [], output, external = [], ...others } = config || {}
  if (output == null) {
    output = makeOutput()
  }

  const arr = Array.isArray(output) ? output : [output]
  const outputs = []
  arr.forEach((item) => {
    outputs.push({
      format: 'umd',
      file: 'dist/index.js',
      sourcemap: true,
      ...item,
    })

    // extra external modules
    if (item.globals) {
      Object.keys(item.globals).forEach((key) => {
        if (!external.includes(key)) {
          external.push(key)
        }
      })
    }
  })

  return {
    input: './src/index.ts',
    output: outputs,
    plugins: [
      typescript({ declaration: false }),
      resolve(),
      commonjs(),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      terser(),
      filesize(),
      ...plugins,
    ],
    external,
    ...others,
  }
}

const defaultConfig = config()

export default defaultConfig
