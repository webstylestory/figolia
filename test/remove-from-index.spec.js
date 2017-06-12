import { expect } from 'chai';

import initServices from '../src/init-services';
import removeFromIndex from '../src/remove-from-index';

// Helper function to `expect` functions with args
// Usage : `expectCalling(myFunc).withArgs('badArg').to.throw(/gtfo/)`
let expectCalling = func => ({ withArgs: (...args) => expect(() => func(...args)) });

// Environment variables must be provided for the tests to work
const now = Date.now();
const prefix = `ALGOLIA_FIREBASE_INDEXER_TEST_${now}`;

const { fb, algolia } = initServices();

const CONFIG = {
    ...global.CONFIG,
    throttleDelay: 10,
    liveIndex: false,
    schema: {
        test: {
            timestampField: 'updatedAt',
            path: 'algolia/tests/testData',
            index: `${prefix}_test`
        }
    }
};



//
// Fixture data
//

const algoliaFixtures = [
    {
        objectID: 'defaultKey1',
        field: 'champagne'
    },
    {
        objectID: 'defaultKey2',
        field: 'champagne'
    }
];


//
// The tests
//

describe('Object removal from Algolia index', function() {
    // Take your time, baby (10min/test)
    this.timeout(10 * 60 * 1000);

    before('Setup Algolia and Firebase test data', function() {

        // Init test data
        const index = algolia.initIndex(CONFIG.schema.test.index);

        return index.saveObjects(algoliaFixtures)
            .then(task => index.waitTask(task.taskID));

    });

    after('Cleaning up Algolia and Firebase test data', function() {

        const index = algolia.initIndex(CONFIG.schema.test.index);

        // Remove test data
        return algolia.deleteIndex(CONFIG.schema.test.index)
            .then(task => index.waitTask(task.taskID));

    });

    it('should throw an error if services are missing', function() {

        expectCalling(removeFromIndex).withArgs({
            firebaseObjects: {},
            CONFIG,
            dataset: { path: 'any' },
            fb,
            algolia: null
        }).to.throw(Error);

    });

    it('should do nothing if object to remove is not in index', function() {

        const index = algolia.initIndex(CONFIG.schema.test.index);

        return removeFromIndex({
            firebaseObjects: { keyMissing: {} },
            CONFIG,
            dataset: CONFIG.schema.test,
            fb,
            algolia
        })
        .then(() => index.search('champagne'))
        .then(res => {

            expect(res.nbHits).to.equal(2);

        });
    });

    it('should remove object if found in index', function() {

        const index = algolia.initIndex(CONFIG.schema.test.index);

        return removeFromIndex({
            firebaseObjects: { 'defaultKey1': {} },
            CONFIG,
            dataset: CONFIG.schema.test,
            fb,
            algolia
        })
        .then(() => index.search('champagne'))
        .then(res => {

            expect(res.nbHits).to.equal(1);

        });
    });

});

