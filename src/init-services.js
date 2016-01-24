import Firebase from 'firebase';
import algoliasearch from 'algoliasearch';
import Debug from './debug';

const info = Debug('info:init');

function initServices(CONFIG) {
    //
    // Connect to Firebase
    //
    Firebase.enableLogging(Debug.enabled('firebase'), Debug('firebase'));
    const fbInstance = `https://${CONFIG.firebase.instance}.firebaseio.com`;
    const fb = new Firebase(fbInstance);

    info(`Connected to Firebase instance ${fbInstance}`);

    //
    // Connect to algolia
    //
    const { applicationId, apiKey } = CONFIG.algolia;
    const algolia = algoliasearch(applicationId, apiKey);

    info(`Connected to Algolia appId ${applicationId}`);

    return { fb, algolia };
}

export default initServices;
