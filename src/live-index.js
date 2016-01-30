import addToIndex from './add-to-index';
import removeFromIndex from './remove-from-index';
import Debug from './debug';

const info = Debug('figolia:info:live-index');

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

    const addOrUpdateObject = fbRef => {

        let firebaseObjects = {};
        if (firebaseObjects) {
            firebaseObjects[fbRef.key()] = fbRef.val();
        }

        return addToIndex({
            firebaseObjects,
            CONFIG,
            dataset,
            fb,
            algolia
        });

    };

    let datasetRef = fb
        .child(dataset.path)
        .orderByChild(CONFIG.timestampField)
        .startAt(ts + 1);

    // Listen for changes to Firebase data, only recent items
    // (`modifiedAt` field should contain a value > ts + 1)
    datasetRef.on('child_added', addOrUpdateObject);
    datasetRef.on('child_changed', addOrUpdateObject);

    // Listen to all dataset for removals
    fb.child(dataset.path).on('child_removed', fbRef =>
        removeFromIndex({ fbRef, CONFIG, dataset, fb, algolia })
    );

    return fb;
};

export default liveIndex;
