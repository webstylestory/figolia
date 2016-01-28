import Promise from 'bluebird';
import { maxBy as _maxBy } from 'lodash';

//
// storeLastTimetamp will store the oldest object timestamp in Firebase
//   for future reference (restart later indexing at that point instead of
//   a full reindex)
//
// @return Promise
//
const storeLastTimestamp = ({ objects, CONFIG, dataset, fb }) => {

    if (!CONFIG.timestampField || !CONFIG.firebase.uid || !dataset.index) {
        return Promise.resolve(null);
    }

    let oldestObject = _maxBy(objects, CONFIG.timestampField);
    return fb
        .child(`${CONFIG.firebase.uid}/${dataset.index}/ts`)
        .set(oldestObject[CONFIG.timestampField])
        .then(() => {
            return oldestObject[CONFIG.timestampField];
        })

};

export default storeLastTimestamp;
