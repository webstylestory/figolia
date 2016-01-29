import Promise from 'bluebird';

//
// getLastTimetamp will get the last indexing timestamp from Firebase
//
const getLastTimestamp = ({ CONFIG, dataset, fb }) => {

    if (!CONFIG.timestampField || !CONFIG.firebase.uid || !dataset.index) {
        return Promise.resolve(null);
    }

    return fb
        .child(`${CONFIG.firebase.uid}/${dataset.index}/ts`)
        .once('value')
        .then(fbRef => {
            return fbRef && fbRef.val() || null;
        });

};

export default getLastTimestamp;
