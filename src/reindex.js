import addToIndex from './add-to-index';

//
//  `fullReindex` takes a dataset configuration object in parameters and
//  reset relevant Algolia index with current Firebase information
//
//  @return Promise
//
const reindex = ({ ts, CONFIG, dataset, fb, algolia }) => {

    const objectQuery = ts && CONFIG.timestampField ?

        fb.child(dataset.path)
            .orderByChild(CONFIG.timestampField)
            .startAt(ts + 1) :

        fb.child(dataset.path);

    // If no timestamp, clear index before processing, it is a full reindex
    const clearIndex = !ts;

    return objectQuery.once('value').then(fbRef => addToIndex({
        clearIndex,
        firebaseObjects: fbRef.val(),
        CONFIG,
        dataset,
        fb,
        algolia
    }));
};

export default reindex;
