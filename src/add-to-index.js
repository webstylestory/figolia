import Debug from 'debug';
import {
    maxBy as _maxBy,
    omit as _omit,
    pick as _pick,
    values as _values } from 'lodash';
import prettyjson from 'prettyjson';
import Promise from 'bluebird';

import indexExists from './index-exists.js';

const info = Debug('figolia:info:add-to-index');
const debug = Debug('figolia:add-to-index');

//
// addToIndex will push items (firebaseObjects: Array) in the Algolia index
// set in the configuration for this dataset. If no objects, or, if
// clearIndex = true, target index will be first cleared.
//
// @return Promise returing timestamp of last indexed object or null
//
const addToIndex = ({
    ts,
    clearIndex = false,
    firebaseObjects,
    CONFIG,
    dataset,
    fb,
    algolia
}) => {

    // The WIP array of objects to push to index
    let objectsToIndex = [];
    // Temp index settings if we overwrite the target index
    let tempIndexName;
    let tempIndex;
    // Target index
    let index = algolia.initIndex(dataset.index);

    // If Firebase dataset is empty or missing, just clear the index
    if (!firebaseObjects) {
        info(`Firebase dataset '${dataset.path}' contains no new items`);
        return indexExists({
                indexName: dataset.index,
                algolia
            })
            .then(indexExists => indexExists && index.clearIndex())
            .then(task => task && index.waitTask(task.taskID))
            .then(() => ts);
    }

    // Also clear the index if asked by `clearIndex` argument
    if (clearIndex) {
        tempIndexName = `${dataset.index}_temp`;
        tempIndex = algolia.initIndex(tempIndexName);
    }

    // Gather objects to push inside `objectsToIndex` array
    for (let key in firebaseObjects) {
        /* istanbul ignore else */
        if (firebaseObjects.hasOwnProperty(key)) {
            let fbObject = { ...firebaseObjects[key] };
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
            // in case the custom key is not beyond included fields.
            fbObject.objectID = dataset.key ?
                firebaseObjects[key][dataset.key] : key;

            objectsToIndex.push(fbObject);
        }
    }

    info(`Pushing ${objectsToIndex.length} object(s) to index ${dataset.index}`);

    // Push to target index, or to overwriting temp index if clearIndex
    let indexToModify = clearIndex ? tempIndex : index;

    // Process pushing objects to relevant index, and moving index if necessary
    return indexToModify.saveObjects(objectsToIndex)
        .then(task => indexToModify.waitTask(task.taskID))
        .then(() => {
            if (clearIndex) {
                debug(`Moving index ${tempIndexName} to ${dataset.index}`);
                // TODO(#14) is this settings migration usefull ?
                // Sync settings from main index to the new one (if already exists)
                // return indexExists({
                //     indexName: dataset.index,
                //     algolia
                // })
                // .then(indexExists => {
                //     debug(`Getting ${dataset.index} index settings? ${indexExists}`);
                //     return indexExists ? index.getSettings() : null;
                // })
                // .then(settings => {
                //     debug(`Setting ${tempIndexName} index settings? ${settings}`);
                //     return settings ? tempIndex.setSettings(settings) : null;
                // })
                return algolia.moveIndex(tempIndexName, dataset.index)
                    .then(task => tempIndex.waitTask(task.taskID));
            }
        })
        // Store last timestamp, if available, for future reference
        .then(() => {
            let lastObject = _maxBy(_values(firebaseObjects), dataset.timestampField)
            let ts = lastObject[dataset.timestampField] || null;

            return fb.child(`${CONFIG.firebase.uid}/${dataset.index}/ts`)
                .set(ts)
                .then(() => ts);
        })
        // Eventually return timestamp
        .then(ts => {
            debug(`Indexed ${objectsToIndex.length} items in ${dataset.index} at ${ts}`);
            return ts;
        });


};

export default addToIndex;
