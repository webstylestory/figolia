# algolia-firebase-indexer

Nodejs daemons that keep Algolia search indexes up to date against firebase dataset

---

## Configuration

Edit the `config.js` file with the data relevant to your setup, example below.

    export default {
        firebase: {                           // Firebase credentials
            instance: 'TO_BE_CHANGED',        // Firebase instance
            secret: 'TO_BE_CHANGED',          // Firebase secret
            dataPath: 'algolia',              // Where to store stats and backend data
            uid: 'algolia'                    // Firebase token will be generated with this uid
        },
        algolia: {                            // Algolia credentials
            applicationId: 'TO_BE_CHANGED',   // Application ID
            apiKey: 'TO_BE_CHANGED'           // *Admin* API Key
        },
        schema: [{                            // Array of Firebase datasets to index in Algolia
            path: 'app/todo',                 // Firebase path
            name: 'prod_todo_lists',          // Algolia name (must exist already)
            key: 'id',                        // Optional, name of ID field (otherwise, the object key will be used)
            lastModTime: 'modifiedAt'         // Optional, this field will be checked against last run date to see if reindexing is necessary. WARNING: Without this field being corectly configured, everything is re-indexed at rerun
            include: [                        // Optional, list of fields to index (otherwise, every field will be indexed)
                'name',
                'created',
                'modified',
                'itemsNumber'
            ]
        }, {                                  // Second example dataset to index
            path: 'app/todoItems',
            name: 'prod_todo_items'
        }]
    };

### Firebase configuration

In order for `algolia-firebase-indexer` to work properly, it has to store some backend 
information in firebase. You can specify their storage path in the config - see above.

What is it stored, for eaxh index ? 

  * Number if items indexed
  * Last known indexing date 

### Reindexing, incremental indexing

This daemon supports a simple mode where every indexed object in Algolia is dropped at runtime, and then re-indexed from the current Firebase connection.

For more serious usage, this is not reccomended, as it can lead to many useless operations, and bandwith waste.

The suggested usage is to specify `dataPath` and `uid` in `firebase` config, and give
write access to that uid in the Firebase Rules (see Firebase docs). Also mandatory, the last modificated time of each items must be set in the scema definition.

Simplest rules to define in Firebase for the backend data path (with default values) :

    "algolia": {                              
        ".read": "auth.uid == 'algolia'",
        ".write": "auth.uid == 'algolia'",
    }

---

## Usage

`node bootstrap.js`

For production setup, I strongly encourage the use of a good process manager 
like (http://github.com)[PMII]


---

## Contribute

PRs are welcome, just follow common sense, and for the style, please comply
to the rules in `.editorconfig` and `.eslintrc`.
