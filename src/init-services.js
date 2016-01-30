import Promise from 'bluebird';
import Firebase from 'firebase';
import FirebaseTokenGenerator from 'firebase-token-generator';
import algoliasearch from 'algoliasearch';

import Debug from './debug';

const info = Debug('figolia:info:init');

//
// initServices initialize both Algolia and Firebase services
//
// @return Promise returning { fb, algolia } services object
//
function initServices(CONFIG) {

    // Connect to algolia
    const { applicationId, apiKey } = CONFIG.algolia;
    const algolia = algoliasearch(applicationId, apiKey);

    info(`Connected to Algolia appId ${applicationId}`);

    // Connect to Firebase
    Firebase.enableLogging(Debug.enabled('firebase'), Debug('firebase'));
    const fbInstance = `https://${CONFIG.firebase.instance}.firebaseio.com`;
    const fb = new Firebase(fbInstance);

    // Authenticate Firebase connection with credentials, if available
    if (!!CONFIG.firebase.secret && !!CONFIG.firebase.uid) {
        let tokenGenerator = new FirebaseTokenGenerator(CONFIG.firebase.secret);
        let token = tokenGenerator.createToken({ uid: CONFIG.firebase.uid });

        return fb.authWithCustomToken(token)
            .then(() => {
                info(
                    `Connected to Firebase instance ${fbInstance} ` +
                    `(authenticated as ${CONFIG.firebase.uid})`
                );
                return { fb, algolia };
            });
    }

    info(`Connected to Firebase instance ${fbInstance} (without auth)`);

    return Promise.resolve({ fb, algolia });
}

export default initServices;
