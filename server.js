import Firebase from 'firebase';
import algoliasearch from 'algoliasearch';

import CONFIG from './config';
// import clearAlgoliaIndex from './util';

const { applicationId, apiKey } = CONFIG.algolia;
const algo = algoliasearch(applicationId, apiKey);

const fb = new Firebase(CONFIG.firebase.instance + '.firebaseio.com/');

CONFIG.schema.forEach(dataset => {
    console.log('Dataset found in config', dataset.path, dataset.name);
    //
});

// let index = client.initIndex('contacts');
// client.destroy();
process.exit(0);
