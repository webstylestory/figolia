# algolia-firebase-indexer

Nodejs daemons that keep Algolia search indexes up to date against firebase dataset

---

## Configuration

Edit the `config.js` file with the data relevant to your setup, example below.

    export default {
        firebaseApiKey: 'YOUR_API_KEY_HERE',  // Firebase API key (read-only is ok)
        algoliaApiKey: 'YOUR_API_KEY_HERE',   // Admin API Key
        schema: [{                            // Array of Firebase datasets to index in Algolia
            path: 'app/todo',                 // Firebase path
            name: 'prod_todo_lists',          // Algolia name (must exist already)
            key: 'id',                        // Optional, name of ID field (otherwise, the object key will be used)
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


---

## Usage

`node bootstrap.js`

For production setup, I strongly encourage the use of a good process manager 
like (http://github.com)[PMII]


---

## Contribute

PRs are welcome, just follow common sense, and for the style, please comply
to the rules in `.editorconfig` and `.eslintrc`.
