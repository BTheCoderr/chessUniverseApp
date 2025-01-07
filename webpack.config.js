const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: {
    game: './public/js/game.js',
    tutorial: './public/js/tutorial.js',
    betting: './public/js/betting.js',
    botGame: './public/js/botGame.js',
    analysis: './public/js/analysis.js',
    spectate: './public/js/spectate.js',
    puzzles: './public/js/puzzles.js',
    'puzzle-solver': './public/js/puzzle-solver.js',
    historical: './public/js/historical.js',
    profile: './public/js/profile.js',
    communication: './public/js/communication.js',
    sounds: './public/js/sounds.js'
  },
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    filename: isDevelopment ? '[name].bundle.js' : '[name].[contenthash].js',
    publicPath: '/dist/',
    clean: true // Clean the dist folder before each build
  },
  resolve: {
    alias: {
      jquery: path.resolve(__dirname, 'node_modules/jquery/dist/jquery.js'),
      '@': path.resolve(__dirname, 'public/js'), // Alias for easier imports
      '@services': path.resolve(__dirname, 'services'),
      '@utils': path.resolve(__dirname, 'utils')
    },
    extensions: ['.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            cacheDirectory: true // Enable babel caching
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: isDevelopment
            }
          },
          'postcss-loader' // For autoprefixer and other PostCSS features
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name].[hash][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash][ext]'
        }
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }),
    new MiniCssExtractPlugin({
      filename: isDevelopment ? '[name].css' : '[name].[contenthash].css'
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ],
  optimization: {
    minimize: !isDevelopment,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2
          },
          mangle: {
            safari10: true
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true
          }
        }
      }),
      new CssMinimizerPlugin()
    ],
    splitChunks: {
      chunks: 'all',
      name: false, // Don't use a single name for all chunks
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // Get the name. E.g. node_modules/packageName/not/this/part.js
            // or node_modules/packageName
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            // npm package names are URL-safe, but some servers don't like @ symbols
            return `vendor.${packageName.replace('@', '')}`;
          }
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: -20
        }
      }
    },
    runtimeChunk: 'single'
  },
  devtool: isDevelopment ? 'eval-source-map' : 'source-map',
  performance: {
    hints: isDevelopment ? false : 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  stats: {
    colors: true,
    hash: true,
    timings: true,
    assets: true,
    chunks: false,
    chunkModules: false,
    modules: false,
    children: false
  },
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename] // Include config in cache keys
    }
  }
}; 