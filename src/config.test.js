'use strict';

const createDevServerConfig = require('../config/webpackDevServer.config');
const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');

describe('WebpackDevServer Configuration', () => {
  it('should be a valid WebpackDevServer v5 configuration object', () => {
    const proxyConfig = undefined;
    const allowedHost = 'localhost';
    const serverConfig = createDevServerConfig(proxyConfig, allowedHost);

    // We create a mock compiler because WebpackDevServer requires one
    const compiler = webpack({
      mode: 'development',
      entry: './src/index.tsx',
    });

    // This will throw if the configuration is invalid according to WDS schema
    try {
      const devServer = new WebpackDevServer(serverConfig, compiler);
      expect(devServer).toBeDefined();
    } catch (error) {
      // Re-throw the error with a more helpful message if it's a schema validation error
      if (error.name === 'ValidationError' || error.message.includes('Invalid options object')) {
        throw new Error(`WebpackDevServer config validation failed: ${error.message}`);
      }
      throw error;
    }
  });
});

describe('Test environment', () => {
  it('runs outside UTC, so that time zone bugs are caught', () => {
    // Set in scripts/test.js; America/Los_Angeles is UTC-8 / UTC-7 (DST).
    expect(new Date('2026-01-15T12:00:00Z').getTimezoneOffset()).toBe(480)
    expect(new Date('2026-07-15T12:00:00Z').getTimezoneOffset()).toBe(420)
  });
});
