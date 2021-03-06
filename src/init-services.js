import path from 'path';
import * as FirebaseAdmin from 'firebase-admin';
import algoliasearch from 'algoliasearch';

import Debug from './debug';

const info = Debug('figolia:info:init');

export default function initServices() {

    global.CONFIG = {
        // Firebase credentials
        firebase: {
            instance: process.env.FIREBASE_INSTANCE || '',
            serviceAccountFile: process.env.FIREBASE_ACCOUNT || '',
            // Where to store server metadata
            path: process.env.FIREBASE_PATH || 'algolia',
            // Firebase token will be generated with this uid (to write above path)
            uid: process.env.FIREBASE_UID || 'algolia'
        },
        // Algolia credentials
        algolia: {
            applicationId: process.env.ALGOLIA_APP_ID || '',
            // *Admin* API Key
            apiKey: process.env.ALGOLIA_API_KEY || ''
        },
        ...global.CONFIG
    };

    // Connect to algolia
    const { applicationId, apiKey } = global.CONFIG.algolia;
    if (!applicationId || !apiKey) {
        info('ERROR: Will not connect to algolia (missing app ID or key)');
        return { fb: null, algolia: null };
    }
    const algolia = algoliasearch(applicationId, apiKey);

    info(`Connected to Algolia appId ${applicationId}`);

    // Only initialize Firebase if it wasn't done before
    if (!FirebaseAdmin.apps.length) {
        FirebaseAdmin.database.enableLogging(Debug.enabled('firebase'), Debug('firebase'));
        // Service account is provided as a file, but for testing purposes on external services
        // (like travis) indivdual fields are provided in the environment. Private key can be found
        // in the service account file and provided as an environment variable, only new lines (\n)
        // must be replaced by %NEWLINE% so the script below can provide the correct key.
        // Also, firebaseProjectId is the same as the instance, except it does not accept leading numbers
        const firebaseProjectId = (process.env.FIREBASE_INSTANCE || '').replace(/^[0-9]+/, '');
        if (!global.CONFIG.firebase.serviceAccountFile &&
            (!process.env.FIREBASE_INSTANCE || !process.env.FIREBASE_PRIVATE_KEY)) {
            info('ERROR: Will not connect to algolia (missing serviceAccount file)');
            return { fb: null, algolia: null };
        }
        const serviceAccount = global.CONFIG.firebase.serviceAccountFile ?
            require(global.CONFIG.firebase.serviceAccountFile) : {
                projectId: firebaseProjectId,
                clientEmail: `server@${firebaseProjectId}.iam.gserviceaccount.com`,
                privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/%NEWLINE%/g, '\n')
            };
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
