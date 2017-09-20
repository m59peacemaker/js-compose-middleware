import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

const Plugins = () => [
  resolve({
    module: true, browser: true, jsnext: true, main: true, extensions: [ '.js', '.json' ]
  }),
  commonjs()
]

export default [
  {
    input: 'src/index.js',
    output: {
      file: 'build/index.cjs.js',
      format: 'cjs'
    },
    plugins: Plugins()
  }
]
