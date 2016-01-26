import { maxBy as _maxBy } from 'lodash';

//
// storeLastTimetamp will store the oldest object timestamp in Firebase
//   for future reference (restart later indexing at that point instead of
//   a full reindex)
//
const storeLastTimestamp = ({ objects, CONFIG, dataset, fb }) => {

    if (!CONFIG.timestampField || !CONFIG.firebase.uid) {
        return;
    }

    let oldestObject = _maxBy(objects, CONFIG.timestampField);
    return fb
        .child(`${CONFIG.firebase.uid}/${dataset.index}/ts`)
        .set(oldestObject[CONFIG.timestampField]);

};

export default storeLastTimestamp;
