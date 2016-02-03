import { partial as _partial, find as _find } from 'lodash';
import prettyjson from 'prettyjson';

import addToIndex from './add-to-index';
import removeFromIndex from './remove-from-index';
import Debug from './debug';

const info = Debug('figolia:info:live-index');
const debug = Debug('figolia:live-index');

// The last timestamp when API was calles
let lastCallTime = null;
// A call will be scheduled using setTimeout, referenced in this variabls
let pendingTimeout = null;
// The cached items will be stored in this object
let pendingTasks = {};

// Add items to cache to throttle API calls
const addToCache = (index, type, fbRef) => {
    if (!pendingTasks[index]) {
        pendingTasks[index] = { add: {}, update: {}, del: {} };
    }
    pendingTasks[index][type][fbRef.key()] = fbRef.val();
};

//
//  `liveIndex` takes a dataset configuration object in parameters and
//  listen for CRUD Firebase operation to update Algolia index accordingly
//
//  @return firebase reference if it correctly creates the 3 listeners, null otherwise
//
const liveIndex = ({ ts, CONFIG, dataset, fb, algolia }) => {

    if (!ts) {
        info(`[WARN] Discarding live indexing for ${dataset.path}: no timestamp found`);
        return null;
    }
    info(`Now listening for ${dataset.path} Firebase changes to index `);

    // Function that actually call Algolia API
    // note : this function process indexing for all datasets
    const callApi = () => {
        debug('Now indexing items to Algolia', prettyjson.render(pendingTasks),
            lastCallTime, pendingTimeout);
        lastCallTime = Date.now();
        /* istanbul ignore else */
        if (pendingTimeout) {
            clearTimeout(pendingTimeout);
            pendingTimeout = null;
        }

        let firebaseObjects = {};
        for (let index in pendingTasks) {
            let dataset = _find(CONFIG.schema, { index: index });

            firebaseObjects = {
                ...pendingTasks[index].add,
                ...pendingTasks[index].update
            };
            if (Object.keys(firebaseObjects).length) {
                addToIndex({ firebaseObjects, CONFIG, dataset, fb, algolia });
            }
            firebaseObjects = {
                ...pendingTasks[index].del
            };
            if (Object.keys(firebaseObjects).length) {
                removeFromIndex({ firebaseObjects, CONFIG, dataset, fb, algolia });
            }
        };
        // No more pending items
        pendingTasks = {};
    };

    // Add to cache if throttled, or directly index
    const cacheOrIndex = (type, fbRef) => {
        let now = Date.now();
        addToCache(dataset.index, type, fbRef);
        debug('Pending after addToCache:', prettyjson.render(pendingTasks));
        debug('Date now, last call, timeout', now, lastCallTime, pendingTimeout);

        // If API have been recently called, schedule next call if not already done
        if (lastCallTime &&
            now - lastCallTime < CONFIG.throttleDelay * 1000 &&
            pendingTimeout === null) {
            pendingTimeout = setTimeout(
                callApi,
                CONFIG.throttleDelay * 1000 - (now - lastCallTime)
            );
            return;
        }
        // Otherwise, just index the current pending data
        callApi();
    };

    // Firebase reference for recent items (> last object timestamp)
    let datasetRef = fb
        .child(dataset.path)
        .orderByChild(dataset.timestampField)
        .startAt(ts + 1);

    // Listen for changes to Firebase data, only recent items added, otherwise
    // every item would be reindex here individually.
    // (`modifiedAt` field should contain a value > ts + 1)
    datasetRef.on('child_added', _partial(cacheOrIndex, 'add'));
    // Update and delete can listen to all dataset
    fb.child(dataset.path).on('child_changed', _partial(cacheOrIndex, 'update'));
    fb.child(dataset.path).on('child_removed', _partial(cacheOrIndex, 'del'));

    return fb;
};

export default liveIndex;
