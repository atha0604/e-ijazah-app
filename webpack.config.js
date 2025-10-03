const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'development',
  entry: {
    main: './src/index.js',
    login: './src/pages/login.js',
    admin: './src/pages/admin.js',
    sekolah: './src/pages/sekolah.js'
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/login.html',
      filename: 'login.html',
      chunks: ['login'],
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/admin-full.html',
      filename: 'admin.html',
      chunks: ['admin'],
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/sekolah.html',
      filename: 'sekolah.html',
      chunks: ['sekolah'],
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      chunks: ['main'],
    }),
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
  devServer: {
    static: './dist',
    port: 3001,
    hot: true,
    open: true,
  },
};