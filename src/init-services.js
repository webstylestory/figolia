import * as fb from 'firebase-admin';
import algoliasearch from 'algoliasearch';

import Debug from './debug';

const info = Debug('figolia:info:init');

// Connect to algolia
const { applicationId, apiKey } = CONFIG.algolia;
const algolia = algoliasearch(applicationId, apiKey);

info(`Connected to Algolia appId ${applicationId}`);

// Connect to Firebase
if (!CONFIG.firebase.serviceAccountFile || !CONFIG.firebase.uid) {
    throw new Error('Not able to authenticate, missing serviceAccountFile or uid config values');
}
fb.enableLogging(Debug.enabled('firebase'), Debug('firebase'));
const serviceAccount = require(CONFIG.firebase.serviceAccountFile);
fb.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${CONFIG.firebase.instance}.firebaseio.com`,
    databaseAuthVariableOverride: {
        uid: CONFIG.firebase.uid
    }
});

info(`Connected to Firebase instance ${fbInstance} (authenticated as ${CONFIG.firebase.uid})`);

export default { fb, algolia };
