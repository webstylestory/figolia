# algolia-firebase-indexer

Nodejs daemon that keeps Algolia search indexes up to date against a Firebase dataset

Inspired by Scott Smith's work in this [blog post](http://scottksmith.com/blog/2014/12/09/algolia-real-time-search-with-firebase/)

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

## Logging & debugging

If you need more verbose information in the console, you can use the following command line:

    DEBUG=*,-babel*,-firebase*,-algolia* node server.js

This will enable all the main app debug output, without the insanely verbose debug info from babel, algolia and firebase.

This is equivalent to enabling all debug items in the app, *i.e.* :

    DEBUG=main*,init* node server.js

To shutdown all console output (quiet mode), you can use the following :

    DEBUG=quiet node server.js

---

## License

MIT © 2016 Aurélien Chivot

---

## Contribute

PRs are welcome, just follow common sense, and for the style, please comply
to the rules in `.editorconfig` and `.eslintrc`.
