import Promise from 'bluebird';

import Debug from './debug';

const info = Debug('figolia:info:get-last-timestamp');

//
// getLastTimetamp will get the last indexing timestamp from Firebase
//
// @return Promise returning timestamp or null
//
const getLastTimestamp = ({ CONFIG, dataset, fb }) => {

    if (!dataset.timestampField || !CONFIG.firebase.uid || !dataset.index) {
        info(`Unable to fetch timestamp for index ${dataset.index}`);
        return Promise.resolve(null);
    }

    return fb.child(`${CONFIG.firebase.uid}/${dataset.index}/ts`)
        .once('value')
        .then(fbRef => {
            const ts = fbRef.val();
            info(
                fbRef.val() ?
                `Timestamp for index ${dataset.index}: ${ts}` :
                `Timestamp not found for index ${dataset.index}`
            )
            return ts;
        });

};

export default getLastTimestamp;
