import { expect } from 'chai';
import {
    findIndex as _findIndex,
    maxBy as _maxBy
} from 'lodash';

import initServices from '../src/init-services';
import reindex from '../src/reindex';
import algoliaIndexExists from '../src/algolia-index-exists.js';

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

const algoliaFixtures = [
    {
        objectID: 'key',
        field: 'data'
    }
];

const algoliaSettings =  {
    ranking: ['typo', 'geo', 'words']
};

const firebaseFixtures = {
    tests: {
        thisPathIsEmpty: {},
        testData: {
            defaultKey1: {
                text: 'previously indexed item',
                customId: 'customKey1',
                numberField: 42,
                modifiedAt: now - 200
            },
            defaultKey2: {
                text: 'first new item',
                customId: 'customKey2',
                numberField: 42,
                modifiedAt: now - 100
            },
            defaultKey3: {
                text: 'earliest new item',
                customId: 'customKey3',
                numberField: 42,
                modifiedAt: now
            }
        }
    }
};


//
// The tests
//

describe('Full reindexing of a dataset', function() {
    // Take your time, baby (10min/test)
    this.timeout(10 * 60 * 1000);

    let fb, algolia, CONFIG = baseConfig;

    before('Initialize services, setup Algolia and Firebase test data', function() {

        // Init services
        return initServices(baseConfig).then(services => {
                fb = services.fb;
                algolia = services.algolia;
                const index = algolia.initIndex(`${prefix}_standard_keys`);

                // Setup initial test data
                return Promise.all([
                    index.setSettings(algoliaSettings),
                    index.saveObjects(algoliaFixtures)
                ]);
            })
            .then(tasks => {
                // Only wait th last item for faster processing
                let lastTask = _maxBy(tasks, 'taskID');
                return index.waitTask(lastTask.taskID);
            })
            .then(() => fb
                .child(`${baseConfig.firebase.uid}`)
                .set(firebaseFixtures)
            );
    });

    after('Cleaning up Algolia and Firebase test data', function() {

        const indexesToDelete = [
            `${prefix}_standard_keys`,
            `${prefix}_standard_keys_timestamp`,
            // Also try to delete temp indexes, just in case
            `${prefix}_standard_keys_temp`,
            `${prefix}_standard_keys_timestamp_temp`
        ];

        const firebaseToDelete = [
            `${baseConfig.firebase.uid}/tests`,
            `${baseConfig.firebase.uid}/${prefix}_standard_keys`,
            `${baseConfig.firebase.uid}/${prefix}_standard_keys_timestamp`
        ];

        // Remove test data
        return Promise.all(
                indexesToDelete.map(index => algolia.deleteIndex(index))
            )
            .then(tasks => {
                // We first need to know at which index of the results is the
                // greatest taskID, in order to only wait for this one
                // so the whole process is a lot faster than waiting for all
                // deletions.
                let { idx, taskID } = tasks.reduce((prev, curr, idx) => {
                    if (curr.taskID > prev.taskID) {
                        return { idx: idx, taskID: curr.taskID };
                    }
                    return prev;
                }, { idx: 0, taskID: 0 });
                // Now we know which index to init and wait for the task
                let index = algolia.initIndex(indexesToDelete[idx]);
                return index.waitTask(taskID);
            })
            // Remove test data in firebase
            .then(() => Promise.all(
                firebaseToDelete.map(path => fb.child(path).remove())
            ));
    });

    it('should throw an error if services are missing', function(done) {

        reindex({ CONFIG, dataset: { path: 'any' }, fb, algolia: null })
            .catch(err => {
                expect(err).to.be.instanceof(Error);
                done();
            });

    });

    it('should not empty Algolia index if Firebase path is missing or empty, but ts provided', function() {
        CONFIG.schema.emptyPath = {
            path: `${baseConfig.firebase.uid}/tests/thisPathIsEmpty`,
            index: `${prefix}_standard_keys`
        };

        const args = {
            ts: now,
            CONFIG,
            dataset: CONFIG.schema.emptyPath,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.emptyPath.index);

        return reindex(args)
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(1)

            });
    });

    it('should empty Algolia index if Firebase path is missing or empty (no timestamp)', function() {
        CONFIG.schema.emptyPath = {
            path: `${baseConfig.firebase.uid}/tests/thisPathIsEmpty`,
            index: `${prefix}_standard_keys`
        };

        const args = {
            CONFIG,
            dataset: CONFIG.schema.emptyPath,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.emptyPath.index);

        return reindex(args)
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(0)

            });
    });

    it('should return ts of last object (no timestamp)', function() {
        CONFIG.schema.standardKeys = {
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_standard_keys`
        };

        const args = {
            CONFIG,
            dataset: CONFIG.schema.standardKeys,
            fb,
            algolia
        };

        return reindex(args)
            .then(ts => {

                expect(ts).to.equal(now);

            });
    });

    it('should index only recent items, and return timestamp of last object (timestamp provided)', function() {
        CONFIG.schema.standardKeysTs = {
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_standard_keys_timestamp`
        };

        const timestamp = now - 200;

        const args = {
            ts: timestamp,
            CONFIG,
            dataset: CONFIG.schema.standardKeysTs,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.standardKeysTs.index);

        return reindex(args)
            .then(ts => {

                expect(ts).to.equal(now);

                return index.search();
            })
            .then(res => {

                expect(res.nbHits).to.equal(2);
                expect(res.hits[0])
                    .to.have.property('modifiedAt')
                    .that.is.above(timestamp);
                expect(res.hits[1])
                    .to.have.property('modifiedAt')
                    .that.is.above(timestamp);

            });
    });

    it('should index only recent items, if timestamp provided', function() {
        CONFIG.schema.standardKeysTs = {
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_standard_keys_timestamp`
        };

        const timestamp = now - 200;

        const args = {
            ts: timestamp,
            CONFIG,
            dataset: CONFIG.schema.standardKeysTs,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.standardKeysTs.index);

        return reindex(args)
            .then(ts => {

                expect(ts).to.equal(now);

                return index.search();
            })
            .then(res => {

                expect(res.nbHits).to.equal(2);
                expect(res.hits[0])
                    .to.have.property('modifiedAt')
                    .that.is.above(timestamp);
                expect(res.hits[1])
                    .to.have.property('modifiedAt')
                    .that.is.above(timestamp);

            });
    });

});

