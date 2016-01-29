import Promise from 'bluebird';
import Debug from 'debug';
import prettyjson from 'prettyjson';
import { maxBy as _maxBy, omit as _omit, pick as _pick, values as _values } from 'lodash';

import indexExists from './index-exists.js';
// import storeLastTimestamp from './store-last-timestamp.js';

const info = Debug('info:add-to-index');
const debug = Debug('add-to-index');

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
            .then(res => res && index.waitTask(res.taskID))
            .then(() => null);
    }

    if (clearIndex) {
        // Create a temp index to overwrite the main index
        tempIndexName = `${dataset.index}_temp`;
        tempIndex = algolia.initIndex(tempIndexName);
    }

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
        .then(task => indexToModify.waitTask(task.taskID));

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
            .then(task => tempIndex.waitTask(task.taskID));
    }

    return promise.then(() => {
            let lastObject = _maxBy(_values(firebaseObjects), CONFIG.timestampField)
            let ts = lastObject[CONFIG.timestampField] || null;

            return fb.child(`${CONFIG.firebase.uid}/${dataset.index}/ts`)
                .set(ts)
                .then(() => ts);
        })
        .then(ts => {
            info(`Indexed ${objectsToIndex.length} items in ${dataset.index} at ${ts}`);
            return ts;
        });


};

export default addToIndex;
