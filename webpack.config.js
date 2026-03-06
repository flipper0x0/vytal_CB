var webpack = require('webpack'),
  path = require('path'),
  fileSystem = require('fs-extra'),
  env = require('./utils/env'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  TerserPlugin = require('terser-webpack-plugin')
var { CleanWebpackPlugin } = require('clean-webpack-plugin')

const ASSET_PATH = process.env.ASSET_PATH || '/'

var alias = {
  'react-dom': '@hot-loader/react-dom',
}

// load the secrets
var secretsPath = path.join(__dirname, 'secrets.' + env.NODE_ENV + '.js')

var fileExtensions = [
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
]

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath
}

var options = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    popup: path.join(__dirname, 'src', 'popup', 'index.tsx'),
    background: path.join(__dirname, 'src', 'background', 'index.ts'),
    content: path.join(__dirname, 'src', 'content', 'index.ts'), // Added content script entry
  },
  chromeExtensionBoilerplate: {
    notHotReload: ['background', 'content'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build'),
    clean: true,
    publicPath: ASSET_PATH,
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'sass-loader', options: { sourceMap: true } },
        ],
      },
      {
        test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
        type: 'asset/resource',
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
          { loader: 'source-map-loader' },
          { loader: 'babel-loader' },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    alias: alias,
    extensions: fileExtensions
      .map((extension) => '.' + extension)
      .concat(['.js', '.jsx', '.ts', '.tsx', '.css']),
  },
  plugins: [
    new CleanWebpackPlugin({ verbose: false }),
    new webpack.ProgressPlugin(),
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          to: path.join(__dirname, 'build/manifest.json'),
          force: true,
          transform: function (content, path) {
            let manifest = JSON.parse(content.toString());
            // Inject content scripts dynamically
            manifest.content_scripts = [
              {
                matches: ["<all_urls>"],
                js: ["content.bundle.js"],
                run_at: "document_start",
                all_frames: true
              }
            ];
            return Buffer.from(
              JSON.stringify({
                description: process.env.npm_package_description,
                version: process.env.npm_package_version,
                ...manifest,
              })
            )
          },
        },
        {
          from: 'src/manifest.json',
          to: path.join(__dirname, 'build/manifest-firefox.json'),
          force: true,
          transform: function (content, path) {
            let manifest = JSON.parse(content.toString());
            // Firefox MV3 uses background scripts instead of service workers
            manifest.background = {
              "scripts": ["background.bundle.js"]
            };
            // Firefox specific settings to avoid warnings
            manifest.browser_specific_settings = {
              "gecko": {
                "id": "vytal@flipper0x0",
                "strict_min_version": "109.0"
              }
            };
            // Inject content scripts for Firefox
            manifest.content_scripts = [
              {
                matches: ["<all_urls>"],
                js: ["content.bundle.js"],
                run_at: "document_start",
                all_frames: true
              }
            ];
            return Buffer.from(
              JSON.stringify({
                description: process.env.npm_package_description,
                version: process.env.npm_package_version,
                ...manifest,
              })
            )
          },
        },
        {
          from: 'src/_locales',
          to: path.join(__dirname, 'build/_locales'),
          force: true,
        },
        {
          from: 'src/assets/icon128.png',
          to: path.join(__dirname, 'build'),
          force: true,
        },
        {
          from: 'src/assets/icon48.png',
          to: path.join(__dirname, 'build'),
          force: true,
        },
        {
          from: 'src/assets/Nunito-VariableFont_wght.ttf',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'popup', 'index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
      cache: false,
    }),
  ],
  infrastructureLogging: {
    level: 'info',
  },
}

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-source-map'
} else {
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  }
}

module.exports = options