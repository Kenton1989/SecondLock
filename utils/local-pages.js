///////////////// Config /////////////////////

// configuration of local pages of extension
function defaultConfig(pageName) {
  return {
    entry: `./src/pages/${pageName}/index.jsx`,
    template: `./src/pages/${pageName}/index.html`,
    outName: `${pageName}.html`,
  }
}

let localPages = {
  options: defaultConfig("options"),
  popup: defaultConfig("popup"),
  selectTime: defaultConfig("select-time"),
  timesUp: defaultConfig("times-up"),
}

////////////////// Implementations //////////////////////

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * Generate the webpack configuration to be inserted
 * @param {*} pagesConfig local pages configuration
 * @returns {*} the configs used to inserted into webpack.config.js
 */
function genLocalPageConfig(pagesConfig) {
  let ret = {
    entry: {},
    plugins: []
  }

  for (const key of Object.keys(pagesConfig)) {
    let { entry, template, outName } = pagesConfig[key];

    // add entry
    ret.entry[key] = path.resolve(entry);

    // binding html template to entry
    ret.plugins.push(new HtmlWebpackPlugin({
      template: path.resolve(template),
      filename: outName,
      chunks: [key],
      cache: false,
    }));
  }

  return ret;
}

/**
 * Insert local pages config into webpack config.
 * The modification is performed in place.
 * 
 * @param {*} webpackConfig the webpack config to insert local pages
 */
function insertLocalPages(webpackConfig) {
  // get configs to add
  let toAdd = genLocalPageConfig(localPages);

  // insert configs
  webpackConfig.entry = Object.assign(webpackConfig.entry, toAdd.entry);
  webpackConfig.plugins.push(...toAdd.plugins);
}

module.exports = {
  localPages: localPages,
  insertLocalPages: insertLocalPages
}