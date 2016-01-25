import Promise from 'bluebird';
import Debug from 'debug';
import { pick as _pick } from 'lodash';

import algoliaIndexExists from './algolia-index-exists.js';

const info = Debug('info:full-reindex');
const debug = Debug('full-reindex');

//
//  `fullReindex` takes a dataset configuration object in parameters and
//  reset relevant Algolia index with current Firebase information
//
//  @return Promise
//
const fullReindex = ({ CONFIG, dataset, fb, algolia }) => {

    return fb.child(dataset.path).once('value').then(data => {
        // Array of objects to index
        let objectsToIndex = [];
        let errorMsg;

        // Create a temp index
        let tempIndexName = `${dataset.index}_temp`;
        let tempIndex = algolia.initIndex(tempIndexName);
        let index = algolia.initIndex(dataset.index);

        // Get all objects from Firebase child
        let values = data.val();

        if (!values) {
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

        for (let key in values) {
            /* istanbul ignore else */
            if (values.hasOwnProperty(key)) {
                let fbObject = values[key];
                if (dataset.fields) {
                    // Only keep defined fields in configuration
                    fbObject = _pick(fbObject, dataset.fields);
                }
                // Algolia's objectID as per config, or default key.
                // We use `values[key]` here instead of `fbObject`,
                // in case the custom key is not beyond indexed fields.
                fbObject.objectID = dataset.key ? values[key][dataset.key] : key;
                objectsToIndex.push(fbObject);
            }
        }

        // Add objects to the new index
        // (will return a promise)
        debug(`Putting objects in index ${tempIndexName}: ${objectsToIndex}`);
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
            // Wait for the task to actually finish
            // .then(res => {
            //     debug(`Waiting setting ${tempIndexName} done ${res}`);
            //     return tempIndex.waitTask(res.taskID);
            // })
            // Atomically replace index by the new one
            .then(() => {
                debug(`Moving index ${tempIndexName} to ${dataset.index}`);
                return algolia.moveIndex(tempIndexName, dataset.index);
            })
            // Wait for the task to actually finish
            .then(res => tempIndex.waitTask(res.taskID))
            // .then(() => storeCurrentIndexTime({ CONFIG, dataset, fb }))
            .then(() => {
                info(`Reindexed ${dataset.index}, number of items: ${objectsToIndex.length}`);
                return objectsToIndex.length;
            });
    })

    // Catch any error in this promise chain and report it
    .catch(err => {
        throw new Error(`[ERROR] Error while reindexing ${dataset.index}: ${err}`);
        console.trace(); // TODO: add multi-callback trace here
    });

};

export default fullReindex;
