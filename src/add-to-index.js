import Promise from 'bluebird';
import Debug from 'debug';
import prettyjson from 'prettyjson';
import { pick as _pick, omit as _omit, values as _values } from 'lodash';

import indexExists from './index-exists.js';
import storeLastTimestamp from './store-last-timestamp.js';

const info = Debug('info:full-reindex');
const debug = Debug('full-reindex');

const addToIndex = ({
        clearIndex = false,
        firebaseObjects,
        CONFIG,
        dataset,
        fb,
        algolia
    }) => {

    let objectsToIndex = [];
    let tempIndexName;
    let tempIndex;
    let index = algolia.initIndex(dataset.index);

    // If Firebase dataset is empty or missing, just clear the index
    if (!firebaseObjects) {
        info(`[WARN] Firebase dataset '${dataset.path}' is empty`);
        return indexExists({
                indexName: dataset.index,
                algolia
            })
            .then(indexExists => indexExists && index.clearIndex())
            .then(res => res && index.waitTask(res.taskID));
    }

    if (clearIndex) {
        // Create a temp index to overwrite the main index
        tempIndexName = `${dataset.index}_temp`;
        tempIndex = algolia.initIndex(tempIndexName);
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

    debug(`Pushing objects to index: ${prettyjson.render(objectsToIndex)}`);

    let indexToModify = clearIndex ? tempIndex : index;

    // Add objects to the new index and return the promise
    let promise = indexToModify.saveObjects(objectsToIndex)
        // Wait for the task to actually finish
        .then(res => indexToModify.waitTask(res.taskID));

    if (clearIndex) {
        promise = promise.then(() => indexExists({
                indexName: dataset.index,
                algolia
            }))
            // Sync settings from main index to the new one (if already exists)
            // .then(indexExists => {
            //     debug(`Getting ${dataset.index} index settings? ${indexExists}`);
            //     return indexExists ? index.getSettings() : null;
            // })
            // .then(settings => {
            //     debug(`Setting ${tempIndexName} index settings? ${settings}`);
            //     return settings ? tempIndex.setSettings(settings) : null;
            // })
            // Atomically replace index by the new one
            .then(() => {
                debug(`Moving index ${tempIndexName} to ${dataset.index}`);
                return algolia.moveIndex(tempIndexName, dataset.index);
            })
            // Wait for the task to actually finish
            .then(res => tempIndex.waitTask(res.taskID));
    }

    return promise.then(() => storeLastTimestamp({
            objects: _values(firebaseObjects),
            CONFIG,
            dataset,
            fb
        }))
        .then(ts => {
            info(`Reindexed ${dataset.index}, number of items: ${objectsToIndex.length}`);
            return ts;
        })
        .catch(err => {
            throw new Error(`[ERROR] Error while indexing ${dataset.index}: ${err}`);
        });
};

export default addToIndex;
