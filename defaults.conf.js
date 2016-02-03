/*eslint-disable */
//
// algolia-firebase-indexer main config file
// -----------------------------------------
//
// You must modify this file before running the server
//
// Mandatory information is :
//   * You Algolia and Firebase keys
//   * The schema/indexes you want to sync
//

var CONFIG = {
    // Firebase credentials
    firebase: {
        instance: process.env.FIREBASE_INSTANCE || 'TO_BE_CHANGED',
        secret: process.env.FIREBASE_SECRET || 'TO_BE_CHANGED',
        // Where to store server metadata
        path: process.env.FIREBASE_PATH || 'algolia',
        // Firebase token will be generated with this uid (to write above path)
        uid: process.env.FIREBASE_UID || 'algolia'
    },
    // Algolia credentials
    algolia: {
        applicationId: process.env.ALGOLIA_APP_ID || 'TO_BE_CHANGED',
        // *Admin* API Key
        apiKey: process.env.ALGOLIA_API_KEY || 'TO_BE_CHANGED'
    },
    // Fully reindex all datasets. Can be overiden on the commandline.
    reset: false,
    // Stay running and live-index all firebase operations.
    // Can be overriden on the commandline.
    liveIndex: false,
    // Minimum throttle delay between Algolia API calls (in seconds)
    // Note: between each throttle delay, a maximum of
    // [3 * dataset number] calls can be made (add, update & delete)
    throttleDelay: 10,
    // Optional but strongly reccomended, this field will be checked against last
    // run date to see if reindexing is necessary.
    // Field content must be UNIX timestamp (example Date.now() output).
    // WARNING: Without this field being correctly configured,
    // everything is re-indexed at rerun.
    timestampField: 'updatedAt',
    // Firebase datasets to index in Algolia
    schema: {
//         todoLists: {
//             // Firebase path
//             path: 'app/todo',
//             // Algolia index (must exist already)
//             index: 'dev_todo_lists',
//             // Optional, name of ID field (otherwise,
//             // the Firebase object key will be used)
//             key: 'id',
//             // Optional, dataset-specific update time field
//             // (default is use global setting above)
//             timestampField: 'createdAt',
//             // Optional, list of fields to index
//             // (otherwise, every field will be indexed)
//             includeFields: [
//                 'name',
//                 'updatedAt'
//             ],
//             // Optional, list of fields to exclude from index
//             // Note: if both are specified, `excludeFields`
//             // is applied *after* `includeFields`
//             excludeFields: [
//                 'passwdHash',
//                 'private'
//             ]
//         },
//         todoItems: {
//             // Second example dataset to index
//             path: 'app/todoItems',
//             index: 'dev_todo_items',
//             key: 'id'
//         }
    }
};

//
// Uncomment this for production setup.
//

// if (process.env.NODE_ENV === 'production') {
//
//     CONFIG.firebase.instance = 'TO_BE_CHANGED';
//     CONFIG.firebase.secret = 'TO_BE_CHANGED';
//     CONFIG.schema.todoLists.index = 'prod_todo_lists';
//     CONFIG.schema.todoItems.index = 'prod_todo_items';
//
// }

module.exports = CONFIG;
