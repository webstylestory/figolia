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
import { _defaultsDeep } from 'lodash';

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
    // Firebase datasets to index in Algolia
    schema: {
        todoLists: {
            // Firebase path
            path: 'app/todo',
            // Algolia index (must exist already)
            index: 'dev_todo_lists',
            // Backup index before clearing them
            // (when there is no stats or mode time)
            // leave empty or false to discard backup
            backup: './backups',
            // Optional, name of ID field (otherwise,
            // the Firebase object key will be used)
            key: 'id',
            // Optional, this field will be checked against last
            // run date to see if reindexing is necessary.
            // WARNING: Without this field being corectly configured,
            // everything is re-indexed at rerun.
            lastModTime: 'modifiedAt',
            // Folder where any cleared index backup data will be stored
            backup: './backup',
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
            key: 'id',
            lastModTime: 'modifiedAt',
            backup: './backup'
        }
    }
};

//
// Uncomment this for production setup. This will be merged into CONFIG object.
//

// if (process.env === 'production') {
//     CONFIG = _defaultsDeep({}, CONFIG, {
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
//     });
// }

export default CONFIG;
