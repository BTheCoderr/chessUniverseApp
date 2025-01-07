const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
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
    filename: '[name].bundle.js',
    publicPath: '/dist/'
  },
  resolve: {
    alias: {
      jquery: path.resolve(__dirname, 'node_modules/jquery/dist/jquery.js')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: 'vendors'
    }
  },
  devtool: 'source-map'
}; 