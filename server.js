/* eslint-disable */

// Enable loading ES2016 files with babel
require('babel-register')({
    // Note: ignore option *cannot* be specified in .babelrc
    //       when using babel-register
    ignore: function(filename) {
        // Ignore package modules
        if (filename.match(/figolia.*node_modules/)) {
            return true;
        }
        // Do not ignore figolia files
        if (filename.match(/figolia/)) {
            return false;
        }
        return true;
    },
});
var path = require('path');
var os = require('os');
var program = require('commander');
var packageJson = require(path.join(__dirname, 'package.json'));

// Require main routine
var main = require(path.join(__dirname, 'src/main')).default;

// Commandline management
program
    .version(packageJson.version)
    .description(packageJson.description + '\n\n  ' +
        'Options can be set in configuration file and loaded with -c option, ' +
        'or placed in ~/.figolia.conf.js.\n  An example configuration file, ' +
        'containing default values, can be found here: ' + __dirname +
        '/default.conf.js.\n\n  Full documentation: ' +
        packageJson.homepage
    )
    .usage('[options]')
    .option('-c, --config [path]', 'Specify configuration (default ~/.figolia.conf.js)')
    .option('-l, --live-index', 'Keep server running to live index Firebase operations (otherwise exit after indexing)')
    .option('-r, --reset', 'Force index reset (clear & full reindex)')
    .option('-t, --timestamp-field [name]', 'Object field name containing last modification timestamp (default \'modifiedAt\')')
    .option('-d, --throttle-delay [n]',
        'Minimum throttle delay between Algolia API calls (in seconds, default 10)\n\t\t\t\t  ' +
        'Note: between each throttle delay, a maximum of \n\t\t\t\t  ' +
        '{ 3 * number of datasets } API calls can be made (add, update & delete)',
        parseInt
    )
    .parse(process.argv);

// Resolve configuration file
var conf = program.config;
var configFile = conf || os.homedir() + '/.figolia.conf.js';

// Load user configuration or load default config from module folder
try {

    global.CONFIG = require(path.resolve(configFile).replace(/.js$/, ''));
} catch (err) {
    if (err instanceof SyntaxError) {
        throw err;
    }
    global.CONFIG = require(path.join(__dirname, 'defaults.conf.js'));
}

// Override CONFIG values from commandline
['reset', 'liveIndex', 'timestampField', 'throttleDelay'].forEach(key => {
    global.CONFIG[key] = program[key] || global.CONFIG[key];
});

// Propagate timestampField to dataset config
if (global.CONFIG['timestampField']) {
    for (var key in global.CONFIG.schema) {
        global.CONFIG.schema[key].timestampField =
            global.CONFIG.schema[key].timestampField || global.CONFIG['timestampField'];
    }
}

// Add current version to config
global.CONFIG.version = packageJson.version;

// Launch server
main(global.CONFIG)
    .then(() => {
        // Exit program except if live indexing was started
        if (!global.CONFIG.liveIndex) {
            process.exit(0);
        }
    })
    .catch(err => {
        throw new Error(`[ERROR] ${err}`);
    });
