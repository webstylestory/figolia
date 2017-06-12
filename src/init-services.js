import path from 'path';
import * as FirebaseAdmin from 'firebase-admin';
import algoliasearch from 'algoliasearch';

import Debug from './debug';

const info = Debug('figolia:info:init');

export default function initServices() {

    global.CONFIG = {
        // Firebase credentials
        firebase: {
            instance: process.env.FIREBASE_INSTANCE || 'TO_BE_CHANGED',
            serviceAccountFile: process.env.FIREBASE_ACCOUNT || 'TO_BE_CHANGED',
            // Where to store server metadata
            path: process.env.FIREBASE_PATH || 'algolia',
            // Firebase token will be generated with this uid (to write above path)
            uid: process.env.FIREBASE_UID || 'algolia'
        },
        // Algolia credentials
        algolia: {
            applicationId: process.env.ALGOLIA_APP_ID || 'TO_BE_CHANGED',
            // *Admin* API Key
            apiKey: process.env.ALGOLIA_API_KEY || 'TO_BE_CHANGED'
        },
        ...global.CONFIG
    };

    // Connect to algolia
    const { applicationId, apiKey } = global.CONFIG.algolia;
    const algolia = algoliasearch(applicationId, apiKey);

    info(`Connected to Algolia appId ${applicationId}`);

    // Connect to Firebase
    if (!global.CONFIG.firebase.serviceAccountFile || !global.CONFIG.firebase.uid) {
        throw new Error('Not able to authenticate, missing serviceAccountFile or uid config values');
    }

    // Only initialize Firebase if it wasn't done before
    if (!FirebaseAdmin.apps.length) {
        FirebaseAdmin.database.enableLogging(Debug.enabled('firebase'), Debug('firebase'));
        const serviceAccount = require(path.join(__dirname, '..', global.CONFIG.firebase.serviceAccountFile));
        FirebaseAdmin.initializeApp({
            credential: FirebaseAdmin.credential.cert(serviceAccount),
            databaseURL: `https://${global.CONFIG.firebase.instance}.firebaseio.com`,
            databaseAuthVariableOverride: {
                uid: global.CONFIG.firebase.uid
            }
        });

        info(
            `Connected to Firebase instance ${global.CONFIG.firebase.instance} ` +
            `(authenticated as ${global.CONFIG.firebase.uid})`
        );
    }

    return { fb: FirebaseAdmin.database().ref(), algolia };
}
