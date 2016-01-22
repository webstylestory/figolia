/*eslint-disable */

// Enable loading ES2016 files with babel
require('babel-register');

// Resolve configuration file
var path = require('path');
var arg = process.argv[2] && path.resolve(process.argv[2]);
var configFile = arg && arg.replace(/.js$/, '') || './config';

// Load config
var CONFIG = require(configFile).default;

// Launch server with current config
var main = require('./src/main').default;
main(CONFIG);

