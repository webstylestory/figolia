/* eslint-disable */
//
// algolia-firebase-indexer main config file
// -----------------------------------------
//
// You must modify this file before running the server
//
// Mandatory information is :
//   * You Algolia keys and Firebase service account
//   * The schema/indexes you want to sync
//

var CONFIG = {
    // Firebase credentials
    firebase: {
        // Firebase project name, as seen in your web config:
        // `databaseUrl: 'https://<XXXXX>.firebaseio.com'`
        instance: process.env.FIREBASE_INSTANCE || '', // TO BE CHANGED
        // The bellow file can be downloaded from the Firebase Console in the
        // last tabs of the settings of your project. NEVER SHARE THAT FILE.
        // Note: you can also import `path` and use `__dirname` to refer to this file directory
        // eg. serviceAccountFile: path.join(__dirname, 'serviceAccountFile.json'),
        serviceAccountFile: process.env.FIREBASE_ACCOUNT || '', // TO BE CHANGED
        // Where to store server metadata
        path: process.env.FIREBASE_PATH || 'algolia',
        // Firebase token will be generated with this uid (to write above path)
        uid: process.env.FIREBASE_UID || 'algolia'
    },
    // Algolia credentials
    algolia: {
        // Algolia Application ID
        applicationId: process.env.ALGOLIA_APP_ID || '', // TO BE CHANGED
        // *Admin* API Key
        apiKey: process.env.ALGOLIA_API_KEY || '' // TO BE CHANGED
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
//             ],
//             // Optional, list of fields for which you need N-Gram tokens
//             // ex. "username: 'hermione'", will also create an additional
//             // field "usernameNGrams: ['ermione', 'rmione', 'mione', 'ione', 'one']"
//             // for each word (down to 3 chars), making *infix* search possible
//             // in addition to default prefix search available in Algolia out of the box
//             // letting users search with keyword "mione"
//             // Note: this can be storage-consumming for long fields, use with
//             //       caution ! (preferably on fields with enforced size)
//             // Nested fields can be accessed with dot notation
//             ngrams: ['username', 'profile.fullName']
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
