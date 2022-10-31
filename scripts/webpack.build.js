const { merge } = require('webpack-merge');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { resolve } = require('path');
const commonCfg = require('./webpack.common');

module.exports = merge(commonCfg, {
  mode: 'production',
  entry: {
    plugin: './src/index.tsx',
    ajax: './src/ajax/callConnectorHttp.ts'
  },
  output: {
    globalObject: 'this',
    filename: '[name].js',
    path: resolve(process.cwd(), 'lib'),
    libraryTarget: 'umd',
  },
  externals: [
    {
      react: 'react',
      'react-dom': 'react-dom'
    },
  ],
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
    }),
  ],
});
