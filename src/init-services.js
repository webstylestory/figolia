import Firebase from 'firebase';
import algoliasearch from 'algoliasearch';
import Debug from './debug';

const debug = Debug('init');
const info = Debug('info:init');

function initServices(CONFIG) {
    //
    // Connect to Firebase
    //
    Firebase.enableLogging(Debug.enabled('firebase'), Debug('firebase'));

    const fbInstance = `${CONFIG.firebase.instance}.firebaseio.com`;
    const fb = new Firebase(fbInstance);

    if (!fb) {
        debug(`Could not connect to Firebase instance ${fbInstance}`);
        process.exit(1);
    }

    info(`Connected to Firebase instance ${fbInstance}`);

    //
    // Connect to algolia
    //
    const { applicationId, apiKey } = CONFIG.algolia;

    const algolia = algoliasearch(applicationId, apiKey);

    if (!algolia) {
        debug('Cannot connect to Algolia');
        process.exit(1);
    }

    info(`Connected to Algolia`);

    return { fb, algolia };
}

export default initServices;
