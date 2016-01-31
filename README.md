[![Build Status](https://img.shields.io/travis/webstylestory/figolia.svg?style=flat-square)](https://travis-ci.org/webstylestory/figolia) [![Coverage Status](https://img.shields.io/coveralls/webstylestory/figolia.svg?style=flat-square)](https://coveralls.io/github/webstylestory/figolia) [![Code climate](https://img.shields.io/codeclimate/github/kabisaict/flow.svg?style=flat-square)](https://codeclimate.com/github/webstylestory/figolia) [![Dependency Status](https://img.shields.io/david/webstylestory/figolia.svg?style=flat-square)](https://david-dm.org/webstylestory/figolia) [![devDependency Status](https://img.shields.io/david/dev/webstylestory/figolia.svg?style=flat-square)](https://david-dm.org/webstylestory/figolia#info=devDependencies) [![Babel stage-2 badge](https://img.shields.io/badge/babel-stage%202-blue.svg?style=flat-square)](https://babeljs.io/docs/plugins/preset-stage-2/) [![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](https://raw.githubusercontent.com/webstylestory/figolia/master/LICENSE) [![Made by french tech badge](https://img.shields.io/badge/made%20by-french%20%E2%9D%A4%20tech-orange.svg?style=flat-square)](http://webstylestory.com)


# Figolia


⚡️  Keep your Algolia search indexes in sync with your Firebase datasets!

When using [Firebase](http://firebase.com) as a web or mobile backend, [Algolia](http://algolia.com) search-as-a-service is a really nice addition, considering the poor search and querying capabilities of Firebase. Figolia is the perfect companion to make their synchronization happen in no time.

*(Codebase inspired by Scott Smith's work in this [blog post](http://scottksmith.com/blog/2014/12/09/algolia-real-time-search-with-firebase/))*


## Features


  * sync multiple Firebase references
  * all CRUD Firebase operations reflected in Algolia 
  * restarts from last indexing timestamp the next time it's launched
  * TODO - throttle indexing to limit Algolia API calls


---


  * [Install](#install)
  * [Usage](#usage)
  * [Configuration](#configuration)
      * [Firebase configuration](#firebase-configuration)
      * [Reindexing, incremental indexing](#reindexing-incremental-indexing)
  * [Release Notes](#release-notes)
  * [Known Issues](#known-issues)
  * [Developers](#developers)
      * [Logging & Debugging](#logging--debugging)
      * [testing](#testing)
      * [contribute](#contribute)
  * [License](#license)


## Install


    npm install -g figolia

Or, download from github repository :

    git clone https://github.com/webstylestory/figolia.git
    cd figolia
    npm install


## Usage

    $ figolia --help

      Usage: figolia [options]

      Options:

        -h, --help           output usage information
        -V, --version        output the version number
        -c, --config [path]  Specify configuration (default to ~/.figolia.conf.js)
        -l, --live-index     Keep server running to live index Firebase operations (otherwise exit after indexing)
        -r, --reset          Force index reset (clear & full reindex)

*Note: if downloaded for github, try using `npm link` first*

For production setup, I strongly encourage the use of a good process manager 
like [PM2](https://github.com/Unitech/pm2)

Important : the server needs a config file before it can runs, at least to provide your Algolia and Firebase API keys. See the [section below about configuration](#configuration).


## Configuration


Edit the `config.example.js` file with the data relevant to your setup, and rename it to `config.js` before running the server.


    let CONFIG = {
        // Firebase credentials
        firebase: {
            instance: 'TO_BE_CHANGED',
            secret: 'TO_BE_CHANGED',
            // Where to store server metadata
            path: 'algolia',
            // Firebase token will be generated with this uid (to write above path)
            uid: 'algolia'
        },
        // Algolia credentials
        algolia: {
            applicationId: 'TO_BE_CHANGED',
            // *Admin* API Key
            apiKey: 'TO_BE_CHANGED'
        },
        // Fully reindex all datasets. Can be overiden on the commandline.
        reset: false,
        // Stay running and live-index all firebase operations.
        // Can be overriden on the commandline.
        liveIndex: false,
        // Optional, this field will be checked against last
        // run date to see if reindexing is necessary.
        // Field type must be UNIX timestamp (example Javascript Date.now()).
        // WARNING: Without this field being corectly configured,
        // everything is re-indexed at each rerun.
        timestampField: 'modifiedAt',
        // Firebase datasets to index in Algolia (examples)
        schema: {
            todoLists: {
                // Firebase path
                path: 'app/todo',
                // Algolia index (must exist already)
                index: 'dev_todo_lists',
                // Optional, name of ID field (otherwise,
                // the Firebase object key will be used)
                key: 'id',
                // Optional, list of fields to index
                // (otherwise, every field will be indexed)
                includeFields: [
                    'name',
                    'modifiedAt'
                ],
                // Optional, list of fields to exclude from index
                // Note: if both are specified, `excludeFields` 
                // is applied *after* `includeFields`
                excludeFields: [
                    'passwdHash',
                    'private'
                ]
            },
            todoItems: {
                // Second example dataset to index, minimal config
                path: 'app/todoItems',
                index: 'dev_todo_items'
            }
        }
    };


*Note for production use: you can also uncomment production-specific settings below the main, in the same file, to deal with multi environment setup*


### Firebase configuration


In order for `figolia` to work properly, it has to store 
the last known indexing date in firebase. You can specify the path where you
want this information stored in the config ([see above](#configuration)).

This path will also be used to store data fixtures [if you run the tests](#testing).


### Reindexing, incremental indexing


This daemon supports a simple mode where every indexed object in Algolia is dropped at runtime, and then re-indexed from the current Firebase connection. **Any previously indexed data will be lost.**

For more serious usage, this is not reccomended, as it can lead to many useless operations, and bandwith waste.

I really suggest to specify `path` and `uid` in `firebase` config field, and give
write access to that uid in the Firebase Rules. Also mandatory, the last modificated 
time of each items must be set in the schema definition (for example, 
in a `modifiedAt` field). This is in your app, if you did not implement such feature 
to track the last modified time of each of your objects, you'll have to do so 
before using this server efficiently. 

To allow `algolia` user to write in your Firebase `algolia` path, 
add the following in your Firebase instance security rules:

    // Let figolia daemon keep track of what is in sync
    "algolia": {                              
        ".read": "auth.uid == 'algolia'",
        ".write": "auth.uid == 'algolia'",
    }
    // To avoid Firebase warnings running the tests
    "tests": {
      "testData": {
        ".indexOn": "modifiedAt"
      }
    }


## Release notes

 * 0.1.3 - Return of the .babelrc
 * 0.1.2 - Fix global usage issue with broken babel presets
 * 0.1.1 - Fix commandline issue with missing npm package
 * 0.1.0 - Initial release


## Known issues


  * [#15](#15) If relaunching indexing after a previous one, with timestamp
    stored in Firebase, removed items since then will not be removed from index.
    Workaround is to delete timestamp in `algolia/index` backend in Firebase to 
    force a full reindex.



## Developers


### Logging & debugging


By default, basic info is output in the console. Should you need more debug information, you can use the following command line:

    DEBUG=figolia* npm start

...or go full throttle including algolia and firebase libs debug info :

    DEBUG=* npm start


### Testing


Because Firebase and Algolia accounts are needed for this app, you have to provide
all the necessary credentials as environment variables while running `npm test`:

    FIREBASE_INSTANCE=CHANGE_ME FIREBASE_SECRET=CHANGE_ME ALGOLIA_APP_ID=CHANGE_ME \
    ALGOLIA_API_KEY=CHANGE_ME DEBUG=quiet npm test

Note: The tests are pretty slow, because they wait for all Algolia write
and indexing operations to finish in order to validate the results. You can speed 
up your testing of a specific file by appending its name to the command line:

    FIREBASE_INSTANCE=CHANGE_ME FIREBASE_SECRET=CHANGE_ME ALGOLIA_APP_ID=CHANGE_ME \
    ALGOLIA_API_KEY=CHANGE_ME DEBUG=quiet npm test ./test/testfile.spec.js

*Note bis: although the server can work with a read-only access to Firebase, the tests
cannot, because they have to write fixture data, hence the need for a full Firebase
configuration, including `secret` and `uid` ([see above](#firebase-configuration))*


### Contribute


PRs are more than welcome! Your PR should not break current usage
and pass all tests. Even better if you write the tests for the added code, and 
even better if the new features are documented in this README ;-) 

I will have a look at anything you will have the time to propose.


## License


MIT © 2016 WEB STYLE STORY SARL

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
