const path = require('path');

module.exports = {
  entry: ['./src/index.ts'],
  devtool: 'source-map',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'hipo-sdk.js',
    path: path.resolve(__dirname, 'dist'),
    globalObject: "this",
    library: {
      name: 'HipoSdk',
      type: 'umd',
      export: 'default',
    },
  },
};