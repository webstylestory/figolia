[![Build Status](https://img.shields.io/travis/webstylestory/algolia-firebase-indexer.svg?style=flat-square)](https://travis-ci.org/webstylestory/algolia-firebase-indexer) [![Coverage Status](https://img.shields.io/coveralls/webstylestory/algolia-firebase-indexer.svg?style=flat-square)](https://coveralls.io/github/webstylestory/algolia-firebase-indexer) [![Dependency Status](https://img.shields.io/david/webstylestory/algolia-firebase-indexer.svg?style=flat-square)](https://david-dm.org/webstylestory/algolia-firebase-indexer) [![devDependency Status](https://img.shields.io/david/dev/webstylestory/algolia-firebase-indexer.svg?style=flat-square)](https://david-dm.org/webstylestory/algolia-firebase-indexer#info=devDependencies) ![Babel stage-2 badge](https://img.shields.io/badge/babel-stage%202-blue.svg?style=flat-square) [![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://doge.mit-license.org) ![Made by french tech badge](https://img.shields.io/badge/made%20by-french%20%E2%9D%A4%20tech-orange.svg?style=flat-square)


# algolia-firebase-indexer

Nodejs daemon that keeps Algolia search indexes up to date against a Firebase dataset

Inspired by Scott Smith's work in this [blog post](http://scottksmith.com/blog/2014/12/09/algolia-real-time-search-with-firebase/)

  * [Usage](#usage)
  * [Configuration](#configuration)
      * [Firebase configuration](#firebase-configuration)
      * [Reindexing, incremental indexing](#reindexing-incremental-indexing)
  * [Developers](#developers)
      * [Logging & Debugging](#logging-debugging)
      * [testing](#testing)
      * [contribute](#contribute)
  * [License](#license)


---

## WORK IN PROGRESS

IMPORTANT: This is an early release, check the issues for the remaining tasks before it can be use seriously

---

## Install

    npm install

---

## Usage

    node ./server.js

For production setup, I strongly encourage the use of a good process manager 
like [PM2](https://github.com/Unitech/pm2)

The server needs a config file before it can runs, at least to provide your Algolia and Firebase API keys. See the section below about configuration.

---

## Configuration

Edit the `config.example.js` file with the data relevant to your setup, and rename it to `config.js` before running the server.


    let CONFIG = {
        // Firebase credentials
        firebase: {
            instance: 'TO_BE_CHANGED',
            secret: 'TO_BE_CHANGED',
            // Where to store app stats and backend data in Firebase
            dataPath: 'algolia',
            // Firebase token will be generated with this uid
            uid: 'algolia'
        },
        // Algolia credentials
        algolia: {
            applicationId: 'TO_BE_CHANGED',
            // *Admin* API Key
            apiKey: 'TO_BE_CHANGED'
        },
        // Optional, this field will be checked against last
        // run date to see if reindexing is necessary.
        // WARNING: Without this field being corectly configured,
        // everything is re-indexed at rerun.
        lastModTime: 'modifiedAt',
        // Firebase datasets to index in Algolia
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
                include: [
                    'name',
                    'created',
                    'modified',
                    'itemsNumber'
                ]
            },
            todoItems: {
                // Second example dataset to index
                path: 'app/todoItems',
                index: 'dev_todo_items',
                key: 'itemId'
            }
        }
    };


*Note for production use: you can also uncomment production-specific settings below the main, in the same file, to deal with multi environment setup*

### Firebase configuration

In order for `algolia-firebase-indexer` to work properly, it has to store some backend 
information in firebase. You can specify their storage path in the config - see above.

What is it stored, for each index ? 

  * Number if items indexed
  * Last known indexing date 

### Reindexing, incremental indexing

This daemon supports a simple mode where every indexed object in Algolia is dropped at runtime, and then re-indexed from the current Firebase connection. **Any previously indexed data will be lost.**

For more serious usage, this is not reccomended, as it can lead to many useless operations, and bandwith waste.

The suggested usage is to specify `dataPath` and `uid` in `firebase` config, and give
write access to that uid in the Firebase Rules (see Firebase docs). Also mandatory, the last modificated time of each items must be set in the schema definition.

Don't forget to allow `algolia` user to write in your Firebase `algolia` path:

    // Let algolia-firebase-indexer daemon keep track of what is in sync
    "algolia": {                              
        ".read": "auth.uid == 'algolia'",
        ".write": "auth.uid == 'algolia'",
    }

---

## Developers

### Logging & debugging

If you need more verbose information in the console, you can use the following command line:

    DEBUG=*,-babel*,-firebase*,-algolia* node server.js

This will enable all the main app debug output, without the insanely verbose debug info from babel, algolia and firebase.

This is equivalent to enabling all debug items in the app, *i.e.* :

    DEBUG=main*,init* node server.js

To shutdown all console output (quiet mode), you can use the following :

    DEBUG=quiet node server.js

### Testing

Because Firebase and Algolia accounts are needed for this app, you have to provide
all the necessary credentials as environment variables while running `npm test`:

    FIREBASE_INSTANCE=CHANGE_ME FIREBASE_SECRET=CHANGE_ME ALGOLIA_APP_ID=CHANGE_ME \
    ALGOLIA_API_KEY=CHANGE_ME DEBUG=quiet npm test

(This should not need any global dependencies, but let me know if it does)

### Contribute

PRs are more than welcome! Your PR should not break current usage
and pass all tests. Even better if you write the tests for the added code, and 
even better if the new features are documented in this README ;-) 
But I will have a look at anything you will have the time to bring together.

---

## License

MIT © 2016 WEB STYLE STORY SARL

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
