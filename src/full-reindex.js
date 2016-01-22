import Debug from 'debug';

const info = Debug('info:full-reindex');
const debug = Debug('full-reindex');

//
//  `fullReindex` takes a dataset configuration object in parameters and
//  reset relevant Algolia index with current Firebase information
//
//  return Promise
//
const fullReindex = ({ CONFIG, dataset, fb, algolia }) => {

    let deferred = Promise.defer();

    fb.child(dataset.path).once('value', data => {
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
            errorMsg = `${dataset.path} [WARN] Firebase child is empty`;
            deferred.reject(errorMsg);
            info(errorMsg);
            return;
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
                return index.getSettings()
            })

            .then((settings) => {
                debug(`Setting ${tempIndexName} index settings`);
                return tempIndex.setSettings(settings);
            })

            // Atomically replace index by the new one
            .then(() => {
                debug(`Moving index ${tempIndexName} to ${dataset.index}`);
                return algolia.moveIndex(tempIndexName, dataset.index);
            })

            // .then(() => storeCurrentIndexTime({ CONFIG, dataset, fb }))

            .then(() => {
                info(`Reindexed ${dataset.index}, number of items: ${objectsToIndex.length}`);
                deferred.resolve(objectsToIndex.length);
            })

            // Catch any error in this promise chain and report it
            .catch(err => {
                errorMsg = `[ERROR] Error while reindexing ${dataset.index}: ${err}`;
                deferred.reject(errorMsg);
                info(errorMsg);
                console.trace(); // TODO: add multi-callback trace here
            });

    }, info);

    return deferred.promise;
};

export default fullReindex;
