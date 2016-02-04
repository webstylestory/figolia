import Debug from './debug';

import addToIndex from './add-to-index';

const info = Debug('figolia:info:reindex');

//
//  `fullReindex` takes a dataset configuration object in parameters and
//  reset relevant Algolia index with current Firebase information
//
//  @return Promise
//
const reindex = ({ ts, CONFIG, dataset, fb, algolia }) => {

    const objectQuery = (ts && dataset.timestampField) ?
        // If timestamp available, only reindex recent items
        // TODO(#15) check for deleted items since then, nd remove them from index
        fb.child(dataset.path)
            .orderByChild(dataset.timestampField)
            .startAt(ts + 1) :
        // Otherwise, just get all items
        fb.child(dataset.path);

    // If no timestamp, clear index before processing, it is a full reindex
    const clearIndex = !ts;

    info(`Reindexing ${clearIndex ? 'in full ' : ''}${dataset.path}...`);

    // Process gettings items from Firebase and pushing them to Algolia index
    return objectQuery.once('value')
        .then(fbRef => addToIndex({
            ts,
            clearIndex,
            firebaseObjects: fbRef.val(),
            CONFIG,
            dataset,
            fb,
            algolia
        }))
};

export default reindex;
