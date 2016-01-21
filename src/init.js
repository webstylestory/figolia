import Firebase from 'firebase';
import algoliasearch from 'algoliasearch';
import Debug from 'debug';
import prettyjson from 'prettyjson';

export default (CONFIG) => {

    //
    // Misc debug and error management tools
    //
    if (!Debug.enabled('quiet')) {
        Debug.enable('info');
    }
    const info = Debug('info');

    const debug = Debug('main');

    const exitWithError = (algolia = null) => {
        debug('Exiting with error');
        algolia && algolia.destroy();
        process.exit(1);
    }


    //
    // Connect to algolia
    //
    const algoliaDebug = Debug('algolia');

    const { applicationId, apiKey } = CONFIG.algolia;

    const algolia = algoliasearch(applicationId, apiKey, {
        timeout: 3000,
        debug: Debug.enabled('algolia')
    });

    if (!algolia) {
        algoliaDebug('Cannot connect to Algolia');
        exitWithError();
    }


    //
    // Connect to Firebase
    //
    const fbDebug = Debug('firebase');

    Firebase.enableLogging(Debug.enabled('firebase'), fbDebug);

    const fb = new Firebase(`${CONFIG.firebase.instance}.firebaseio.com/`);
    if (!fb) {
        fbDebug('Cannot connect to Firebase');
        exitWithError(algolia);
    }

    return { fb, algolia };
};
