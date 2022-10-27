const { merge } = require('webpack-merge');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { resolve } = require('path');
const commonCfg = require('./webpack.common');

module.exports = merge(commonCfg, {
  mode: 'production',
  entry: {
    plugin: './src/index.tsx',
    pc: './src/ajax/pc.ts',
    h5: './src/ajax/h5.ts',
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
      'react-dom': 'react-dom',
      '@mybricks/rxui': '@mybricks/rxui',
      '@ant-design/icons': '@ant-design/icons',
      antd: 'antd',
      '@ant-design/icons': {
        commonjs: '@ant-design/icons',
        commonjs2: '@ant-design/icons',
        amd: '@ant-design/icons',
        root: 'icons',
      },
    },
  ],
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
    }),
  ],
});
