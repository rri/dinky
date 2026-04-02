'use strict';
const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

module.exports = env => {
  const hash = createHash('md5');
  hash.update(JSON.stringify(env));

  // Include WebpackDevServer version in the hash
  try {
    const wdsPackageJson = require.resolve('webpack-dev-server/package.json');
    const wdsVersion = require(wdsPackageJson).version;
    hash.update(`webpack-dev-server@${wdsVersion}`);
  } catch (e) {
    // Fallback if webpack-dev-server is not found
  }

  // Include the content of the dev server config file in the hash
  try {
    const devServerConfigPath = path.resolve(__dirname, '../../webpackDevServer.config.js');
    if (fs.existsSync(devServerConfigPath)) {
      hash.update(fs.readFileSync(devServerConfigPath));
    }
  } catch (e) {
    // Fallback if the file cannot be read
  }

  return hash.digest('hex');
};
