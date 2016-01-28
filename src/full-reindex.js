import Promise from 'bluebird';
import Debug from 'debug';
import prettyjson from 'prettyjson';
import { pick as _pick, omit as _omit, values as _values } from 'lodash';

import algoliaIndexExists from './algolia-index-exists.js';
import storeLastTimestamp from './store-last-timestamp.js';

const info = Debug('info:full-reindex');
const debug = Debug('full-reindex');

//
//  `fullReindex` takes a dataset configuration object in parameters and
//  reset relevant Algolia index with current Firebase information
//
//  @return Promise
//
const fullReindex = ({ ts, CONFIG, dataset, fb, algolia }) => {

    let objectQuery = ts && CONFIG.timestampField ?

        fb.child(dataset.path)
            .orderByChild(CONFIG.timestampField)
            .startAt(ts + 1) :

        fb.child(dataset.path);

    return objectQuery.once('value').then(data => {
        // Array of objects to index
        let objectsToIndex = [];
        let errorMsg;

        // Create a temp index
        let tempIndexName = `${dataset.index}_temp`;
        let tempIndex = algolia.initIndex(tempIndexName);
        let index = algolia.initIndex(dataset.index);

        // Get all objects from Firebase child
        let firebaseObjects = data.val();

        if (!firebaseObjects) {
            // If Firebase dataset empty, just clear the Algolia index
            info(`[WARN] Firebase dataset '${dataset.path}' is empty`);
            return algoliaIndexExists({
                    indexName: dataset.index,
                    algolia
                })
                .then(indexExists => indexExists && index.clearIndex())
                .then(res => res && index.waitTask(res.taskID));
        }

        info(`Fully reindexing ${dataset.path}...`);

        for (let key in firebaseObjects) {
            /* istanbul ignore else */
            if (firebaseObjects.hasOwnProperty(key)) {
                let fbObject = firebaseObjects[key];
                if (dataset.includeFields) {
                    // Only keep defined fields in configuration
                    fbObject = _pick(fbObject, dataset.includeFields);
                }
                if (dataset.excludeFields) {
                    // Exclude defined fields in configuration
                    fbObject = _omit(fbObject, dataset.excludeFields);
                }
                // Algolia's objectID as per config, or default key.
                // We use `firebaseObjects[key]` here instead of `fbObject`,
                // in case the custom key is not beyond indexed fields.
                fbObject.objectID = dataset.key ?
                    firebaseObjects[key][dataset.key] : key;

                objectsToIndex.push(fbObject);
            }
        }

        // Add objects to the new index
        // (will return a promise)
        debug(`Putting objects in index ${tempIndexName}: ${prettyjson.render(objectsToIndex)}`);
        return tempIndex.saveObjects(objectsToIndex)
            // Wait for the task to actually finish
            .then(res => tempIndex.waitTask(res.taskID))
            // Sync settings from main index to the new one
            .then(() => algoliaIndexExists({
                indexName: dataset.index,
                algolia
            }))
            .then(indexExists => {
                debug(`Getting ${dataset.index} index settings? ${indexExists}`);
                return indexExists ? index.getSettings() : null;
            })
            .then(settings => {
                debug(`Setting ${tempIndexName} index settings? ${settings}`);
                return settings ? tempIndex.setSettings(settings) : null;
            })
            // Atomically replace index by the new one
            .then(() => {
                debug(`Moving index ${tempIndexName} to ${dataset.index}`);
                return algolia.moveIndex(tempIndexName, dataset.index);
            })
            // Wait for the task to actually finish
            .then(res => tempIndex.waitTask(res.taskID))
            .then(() => storeLastTimestamp({
                objects: _values(firebaseObjects),
                CONFIG,
                dataset,
                fb
            }))
            .then(ts => {
                info(`Reindexed ${dataset.index}, number of items: ${objectsToIndex.length}`);
                return ts;
            });
    })

    // Catch any error in this promise chain and report it
    .catch(err => {
        throw new Error(`[ERROR] Error while reindexing ${dataset.index}: ${err}`);
    });

};

export default fullReindex;
