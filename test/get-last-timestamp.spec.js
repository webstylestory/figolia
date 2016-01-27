import { expect } from 'chai';

import initServices from '../src/init-services';
import getLastTimestamp from '../src/get-last-timestamp';

// Helper function to `expect` functions with args
// Usage : expectCalling(myFunc).withArgs('badArg').to.throw(/gtfo/)
const expectCalling = func => ({ withArgs: (...args) => expect(() => func(...args)) });

// Environment variables must be provided for the tests to work

const CONFIG = {
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

let firebaseFixtures = { ts: now };


//
// The tests
//

describe('Get last indexing timestamp of dataset', function() {
    // Take your time, baby (1min/test)
    this.timeout(60 * 1000);

    let fb;

    before('Initialize services, setup Firebase test data', function() {

        // Init services
        return initServices(CONFIG)
            .then(services => {
                fb = services.fb;
                return fb
                    .child(`${CONFIG.firebase.uid}/${prefix}_test_set`)
                    .set(firebaseFixtures);
            });

    });

    after('Cleaning up Firebase test data', function() {

        // Remove test data
        return fb.child(`${CONFIG.firebase.uid}/${prefix}_test_set`).remove();

    });

    it('should eventually return null if tomestamp config is missing', function() {

        const invalidConfig = {
            ...CONFIG,
            timestampField: null
        };

        return getLastTimestamp({
                CONFIG: invalidConfig,
                dataset: {},
                fb
            })
            .then(ts => {

                expect(ts).to.be.null;

            });

    });

    it('should eventually return null if dataset timestamp is missing', function() {

        const dataset = {
            index: 'not_indexed'
        };

        return getLastTimestamp({ CONFIG, dataset, fb })
            .then(ts => {

                expect(ts).to.be.null;

            });

    });

    it('should eventually return the last dataset indexing timestamp', function() {

        let dataset = {
            index: `${prefix}_test_set`
        };

        return getLastTimestamp({ CONFIG, dataset, fb })
            .then(ts => {

                expect(ts).to.equal(now);

            })
    });

});

