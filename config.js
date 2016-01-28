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
import { defaultsDeep as _defaultsDeep } from 'lodash';

let CONFIG = {
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
    // Optional, this field will be checked against last
    // run date to see if reindexing is necessary.
    // Field type must be UNIX timestamp (example Javascript Date.now()).
    // WARNING: Without this field being correctly configured,
    // everything is re-indexed at rerun.
    //
//  timestampField: 'modifiedAt',
    //
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
//             // Optional, list of fields to index
//             // (otherwise, every field will be indexed)
//             includeFields: [
//                 'name',
//                 'modifiedAt'
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
//             key: 'id',
//             lastModTime: 'modifiedAt',
//             backup: './backup'
//         }
    }
};

//
// Uncomment this for production setup. This will be merged into CONFIG object.
//

// if (process.env.NODE_ENV === 'production') {
//     CONFIG = _defaultsDeep({}, {
//         // Production firebase credentials
//         firebase: {
//             instance: 'TO_BE_CHANGED',
//             secret: 'TO_BE_CHANGED',
//         },
//         schema: {
//             // Example production indexes
//             todoLists: {
//                 idnex: 'prod_todo_lists',
//             },
//             todoItems: {
//                 idnex: 'prod_todo_items',
//             }
//         }
//     }, CONFIG);
// }

export default CONFIG;
