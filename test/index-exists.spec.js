import { expect } from 'chai';

import initServices from '../src/init-services';
import indexExists from '../src/index-exists.js';

// Environment variables must be provided for the tests to work

const config = {
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

    let algolia;

    before('Initialize services, setup Algolia test data', function() {

        // Init services and test data
        return initServices(config).then(services => {
            algolia = services.algolia;
            const index = algolia.initIndex(`${prefix}_test_index`);

            return index.saveObjects(algoliaFixtures)
                .then(task => index.waitTask(task.taskID));
        })

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

