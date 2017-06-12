import { expect } from 'chai';

import initServices from '../src/init-services';
import indexExists from '../src/index-exists.js';

// Environment variables must be provided for the tests to work

const { fb, algolia } = initServices();

const CONFIG = {
    ...global.CONFIG,
    throttleDelay: 10,
    liveIndex: false,
    schema: {}
};


//
// Fixture data
//

const prefix = 'TEST_sguijkasncbh83729374';

const algoliaFixtures = [
    {
        objectID: 'key',
        field: 'data'
    }
];

//
// The tests
//

describe('Checking existence of an Algolia index', function() {

    // Take your time, baby (1min/test)
    this.timeout(60 * 1000);

    before('Setup Algolia test data', function() {

        // Init test data
        const index = algolia.initIndex(`${prefix}_test_index`);

        return index.saveObjects(algoliaFixtures)
            .then(task => index.waitTask(task.taskID));

    });

    after('Cleaning up Algolia test data', function() {

        const index = algolia.initIndex(`${prefix}_test_index`);

        // Remove test data
        return algolia.deleteIndex(`${prefix}_test_index`)
            .then(task => index.waitTask(task.taskID));

    });

    it('should detect an existing index', function() {

        return indexExists({
            indexName: `${prefix}_test_index`,
            algolia
        })
        .then(indexExists => {

            expect(indexExists).to.equal(true);

        });
    });

    it('should detect an non-existing index', function() {

        return indexExists({
            indexName: `${prefix}_test_index_does_not_exists`,
            algolia
        })
        .then(indexExists => {

            expect(indexExists).to.equal(false);

        });
    });

});

