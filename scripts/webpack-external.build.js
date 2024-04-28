const { merge } = require('webpack-merge');
const { resolve } = require('path');
const commonCfg = require('./webpack.common');

/** external axios */
module.exports = merge(commonCfg, {
  mode: 'production',
  entry: {
    'index-with-agent': './src/runtime/callConnectorHttp.ts',
  },
  output: {
    globalObject: 'this',
    filename: '[name].js',
    path: resolve(process.cwd(), 'runtime'),
    libraryTarget: 'umd',
    library: '@mybricks/plugins/service'
  },
  externals: [
    {
      react: 'react',
      'react-dom': 'react-dom',
      'axios': 'axios'
    },
  ],
});
