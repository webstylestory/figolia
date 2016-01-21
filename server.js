/*eslint-disable */

// Enable loading the server with babel
require('babel-register');

var main = require('./src/main').default;
var CONFIG = require('./config').default;

// Launch server with current config
main(CONFIG);

