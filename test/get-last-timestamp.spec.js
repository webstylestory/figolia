import { expect } from 'chai';

import initServices from '../src/init-services';
import getLastTimestamp from '../src/get-last-timestamp';

// Environment variables must be provided for the tests to work

const now = Date.now();
const prefix = `ALGOLIA_FIREBASE_INDEXER_TEST_${now}`;

const { fb, algolia } = initServices();

const CONFIG = {
    ...global.CONFIG,
    throttleDelay: 10,
    liveIndex: false,
    schema: {}
};


//
// The tests
//

describe('Get last indexing timestamp of dataset', function() {
    // Take your time, baby (1min/test)
    this.timeout(60 * 1000);

    before('Setup Firebase test data', function() {

        return fb
            .child(`${CONFIG.firebase.uid}/${prefix}_test_set`)
            .set({ ts: now });

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
            timestampField: 'updatedAt',
            index: 'not_indexed'
        };

        return getLastTimestamp({ CONFIG, dataset, fb })
            .then(ts => {

                expect(ts).to.be.null;

            });

    });

    it('should eventually return the last dataset indexing timestamp', function() {

        let dataset = {
            timestampField: 'updatedAt',
            index: `${prefix}_test_set`
        };

        return getLastTimestamp({ CONFIG, dataset, fb })
            .then(ts => {

                expect(ts).to.equal(now);

            });
    });

});

