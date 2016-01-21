import Firebase from 'firebase';
import algoliasearch from 'algoliasearch';
import Debug from 'debug';
import prettyjson from 'prettyjson';

import CONFIG from './config';

// Misc debug and error management tools
if (!Debug.enabled('quiet')) {
    Debug.enable('info');
}
const info = Debug('info');
const debug = Debug('main');

function exitWithError(algolia = null) {
    debug('Exiting with error');
    algolia && algolia.destroy();
    process.exit(1);
}

// Connect to algolia
const algoliaDebug = Debug('algolia');
const { applicationId, apiKey } = CONFIG.algolia;
const algolia = algoliasearch(applicationId, apiKey, {
    timeout: 3000,
    debug: Debug.enabled('algolia')
});
if (!algolia) {
    algoliaDebug('Cannot connect to Algolia');
    exitWithError();
}

// Connect to Firebase
const fbDebug = Debug('firebase');
Firebase.enableLogging(Debug.enabled('firebase'), fbDebug);
const fb = new Firebase(`${CONFIG.firebase.instance}.firebaseio.com/`);
if (!fb) {
    fbDebug('Cannot connect to Firebase');
    exitWithError(algolia);
}

const envName = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT';
info(`Starting server in ${envName} environment.`);

debug('Starting server with config', prettyjson.render(CONFIG));

for (let key in CONFIG.schema) {
    let dataset = CONFIG.schema[key];

    // let promise = getLastIndexTime(dataset);

    // if (!promise) {
    //     promise = fullReindex(dataset);
    // }

    // promise
    //     .then(continueIndexing)
    //     .catch(err => console.error(err));

    fb.child(dataset.path).once('value', data => {
        // Array of objects to index
        let objectsToIndex = [];

        // Create a temp index
        let tempIndexName = `${dataset.index}_temp`;
        let tempIndex = algolia.initIndex(tempIndexName);
        let index = algolia.initIndex(dataset.index);

        // Get all objects from Firebase child
        let values = data.val();
        if (!values) {
            return console.warn(`${dataset.path} Firebase child is empty`);
        }
        info(`Fully reindexing ${dataset.path}...`);

        for (let key in values) {
            if (values.hasOwnProperty(key)) {
                let fbObject = values[key];
                // Specify Algolia's objectID using the configurated key
                fbObject.objectID = dataset.key ? fbObject[dataset.key] : key;
                objectsToIndex.push(fbObject);
            }
        }

        // Add objects to the new index
        // (without error callback, will return a promise)
        tempIndex.saveObjects(objectsToIndex)
            // Sync settings from main index to the new one
            .then(() => {
                debug(`Getting ${dataset.index} index settings`);
                index.getSettings()
            })
            .then((s) => {
                debug(`Setting ${tempIndexName} index settings`);
                tempIndex.setSettings(s);
            })
            // Atomically replace index by the new one
            .then(() => {
                debug(`Moving index ${tempIndexName} to ${dataset.index}`);
                algolia.moveIndex(tempIndexName, dataset.index);
            })
            .then(() => {
                info(`Reindexed ${dataset.index}, number of items: ${objectsToIndex.length}`);
            })
            .catch(err => {
                debug(`Error while reindexing ${dataset.index}: ${err}`);
                console.trace(); // TODO: add multi-callback trace here
            });

    }, fbDebug);
}
