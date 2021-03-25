var webpack = require('webpack'); 
var path = require('path'); 
var { CleanWebpackPlugin } = require('clean-webpack-plugin'); 
var CopyWebpackPlugin = require('copy-webpack-plugin');
var TerserPlugin = require('terser-webpack-plugin');

var env = require('./utils/env'); 
var { insertLocalPages } = require("./utils/local-pages");

const ASSET_PATH = process.env.ASSET_PATH || '/';

var alias = {
  'react-dom': '@hot-loader/react-dom',
};

// aux function of CopyWebpackPlugin, used to copy files from public folder to build folder
function handlePublicFolderPath({ absoluteFilename }, buildDir = "build", publicDir = "public") {
  // resolve absolute path
  publicDir = path.resolve(publicDir);
  buildDir = path.resolve(buildDir);

  console.assert(absoluteFilename.startsWith(publicDir));
  let dist = buildDir + absoluteFilename.substr(publicDir.length);
  console.log(absoluteFilename, " will be copy to ", dist);
  return dist
}

var mediaFileExt = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'eot',
  'otf',
  'svg',
  'ttf',
  'woff',
  'woff2',
];

var options = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    background: path.join(__dirname, 'src', 'background', 'index.js'),
  },
  chromeExtensionBoilerplate: {
    notHotReload: ['contentScript', 'devtools'],
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].bundle.js',
    publicPath: ASSET_PATH,
  },
  module: {
    rules: [
      {
        // look for .css or .scss files
        test: /\.(css|scss)$/,
        // in the `src` directory
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: new RegExp('.(' + mediaFileExt.join('|') + ')$'),
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        },
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/,
      },
      { test: /\.(ts|tsx)$/, loader: 'ts-loader', exclude: /node_modules/ },
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: 'source-map-loader',
          },
          {
            loader: 'babel-loader',
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: alias,
    extensions: mediaFileExt
      .map((extension) => '.' + extension)
      .concat(['.js', '.jsx', '.ts', '.tsx', '.css']),
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin({
      verbose: true,
      cleanStaleWebpackAssets: true,
    }),
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public/**/*',
          to: handlePublicFolderPath,
          force: true,
        }
      ]
    })
  ],
  infrastructureLogging: {
    level: 'info',
  },
};

insertLocalPages(options);

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-source-map';
} else {
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  };
}

module.exports = options;
