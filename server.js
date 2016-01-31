/*eslint-disable */

// Enable loading ES2016 files with babel
require('babel-register')({
    // Note: ignore and only options *cannot* be specified in .babelrc
    //       when using babel-register
    ignore: false,
    only: /figolia\/src/
});
var program = require('commander');
var packageJson = require('./package.json');

// Require main routine
var main = require('./src/main').default;

// Commandline management
program
    .version(packageJson.version)
    .description(packageJson.description)
    .usage('[options]')
    .option('-c, --config [path]', 'Specify configuration (default to ~/.figolia.conf.js)')
    .option('-l, --live-index', 'Keep server running to live index Firebase operations (otherwise exit after indexing)')
    .option('-r, --reset', 'Force index reset (clear & full reindex)')
    .parse(process.argv);

// Resolve configuration file
var conf = program.config;
var configFile = conf && conf.replace(/.js$/, '') || '~/.figolia.conf';

// Load configuration and override values specified in commandline
var CONFIG = require(configFile).default;
CONFIG.reset = program.reset || CONFIG.reset;
CONFIG.liveIndex = program.liveIndex || CONFIG.liveIndex;

// Launch server
main(CONFIG)
    .then(() => {

        // Exit program except if live indexing was started
        if (!CONFIG.liveIndex) {
            process.exit(0);
        }

    })
    .catch(err => {

        throw new Error(`[ERROR] ${err}`);

    });
