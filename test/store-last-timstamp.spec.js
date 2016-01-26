import { expect } from 'chai';

import initServices from '../src/init-services';
import storeLastTimestamp from '../src/store-last-timestamp';

// Helper function to `expect` functions with args
// Usage : expectCalling(myFunc).withArgs('badArg').to.throw(/gtfo/)
const expectCalling = func => ({ withArgs: (...args) => expect(() => func(...args)) });

// Environment variables must be provided for the tests to work

const baseConfig = {
    firebase: {
        instance: process.env.FIREBASE_INSTANCE,
        secret: process.env.FIREBASE_SECRET,
        path: process.env.FIREBASE_PATH || 'algolia',
        uid: process.env.FIREBASE_UID || 'algolia'
    },
    algolia: {
        applicationId: process.env.ALGOLIA_APP_ID,
        apiKey: process.env.ALGOLIA_API_KEY
    },
    timestampField: 'modifiedAt',
    schema: {}
};


//
// Fixture data
//

const now = Date.now();
const prefix = `ALGOLIA_FIREBASE_INDEXER_TEST_${now}`;

const objects = [
    {
        customId: 'customKey1',
        text: 'blabla champagne blabla',
        numberField: 42,
        stringField: 'this is a test',
        modifiedAt: now
    },
    {
        customId: 'customKey2',
        text: 'blabla wine blabla',
        numberField: 42,
        stringField: 'this is a test',
        modifiedAt: now
    }
];


//
// The tests
//

describe('Store last timestamp of objects', function() {
    // Take your time, baby (1min/test)
    this.timeout(60 * 1000);

    let fb, CONFIG;

    beforeEach(function() {

        CONFIG = { ...baseConfig };

    });

    before('Initialize services', function() {

        // Init services
        return initServices(baseConfig)
            .then(services => {
                fb = services.fb;
            });

    });

    after('Cleaning up Algolia and Firebase test data', function() {

        // Remove test data
        return fb.child(`${baseConfig.firebase.uid}/${prefix}_test_set`).remove();

    });


    it('should do nothing if called without a valid config', function() {

        CONFIG.firebase = {
            ...CONFIG.firebase,
            secret: '',
            uid: ''
        };

        let res = storeLastTimestamp({ objects, CONFIG, dataset: null, fb });

        expect(res).to.be.undefined;

    });

    it('should store last object timestamp', function() {
        let dataset = {
            index: `${prefix}_test_set`
        };

        let res = storeLastTimestamp({ objects, CONFIG, dataset, fb });

        return res
            .then(() => {
                return fb
                    .child(`${baseConfig.firebase.uid}/${prefix}_test_set/ts`)
                    .once('value');
            })
            .then(snap => {

                expect(snap.val()).to.equal(now);

            })
    });

});

