const { merge } = require('webpack-merge');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { resolve } = require('path');
const commonCfg = require('./webpack.common');

module.exports = merge(commonCfg, {
  mode: 'production',
  entry: {
    plugin: './src/index.tsx',
    index: './src/runtime/callConnectorHttp.ts'
  },
  output: {
    globalObject: 'this',
    filename: '[name].js',
    path: resolve(process.cwd(), 'runtime'),
    libraryTarget: 'umd',
  },
  externals: [
    {
      react: 'react',
      'react-dom': 'react-dom'
    },
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        defaultVendors: {
          test: /axios/,
          priority: -10,
          reuseExistingChunk: true,
          name: 'axios'
        },
      },
    },
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
    }),
  ],
});
