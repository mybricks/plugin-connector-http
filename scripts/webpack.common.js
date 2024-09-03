module.exports = {
  target: ["web", "es5"],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              exclude: [/src\/script/],
              presets: [
                '@babel/preset-env',
                '@babel/preset-react'
              ],
              plugins: [
                ['@babel/plugin-proposal-class-properties', {'loose': true}],
                ['@babel/plugin-proposal-private-methods', {'loose': true }],
                [
                  '@babel/plugin-proposal-private-property-in-object',
                  { loose: true }
                ]
              ],
            }
          },
          {
            loader: 'ts-loader',
            options: {
              silent: true,
              transpileOnly: true,
              compilerOptions: {
                module: 'es6',
                target: 'es5'
              }
            },
          },
        ],
      },
      {
        test: /\.jsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              exclude: [/src\/script/],
              presets: [
                '@babel/preset-env',
                '@babel/preset-react'
              ],
              plugins: [
                ['@babel/plugin-proposal-class-properties', {'loose': true}],
                ['@babel/plugin-proposal-private-methods', {'loose': true }],
                [
                  '@babel/plugin-proposal-private-property-in-object',
                  { loose: true }
                ]
              ],
            }
          }
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.less$/i,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: 'http_plugin_[local]_[hash:base64:5]',
              },
            },
          },
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
              },
            },
          },
        ],
      },
      {
        test: /\.d.ts$/i,
        use: [{ loader: 'raw-loader' }],
      },
    ],
  },
  optimization: {
    concatenateModules: false,
  },
};
