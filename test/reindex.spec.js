import { expect } from 'chai';
import { maxBy as _maxBy } from 'lodash';
import prettyjson from 'prettyjson';

import { fb, algolia } from '../src/init-services';
import reindex from '../src/reindex.js';

// Environment variables must be provided for the tests to work

const now = Date.now();
const prefix = `ALGOLIA_FIREBASE_INDEXER_TEST_${now}`;

const CONFIG = {
    firebase: {
        instance: process.env.FIREBASE_INSTANCE,
        accountServiceFile: process.env.FIREBASE_ACCOUNT,
        path: process.env.FIREBASE_PATH || 'algolia',
        uid: process.env.FIREBASE_UID || 'algolia'
    },
    algolia: {
        applicationId: process.env.ALGOLIA_APP_ID,
        apiKey: process.env.ALGOLIA_API_KEY
    },
    throttleDelay: 10,
    liveIndex: false,
    schema: {
        test: {
            timestampField: 'updatedAt',
            path: 'algolia/tests/testData',
            index: `${prefix}_standard_keys`
        }
    }
};


//
// Fixture data
//

const algoliaFixtures = [
    {
        objectID: 'key',
        field: 'data'
    }
];

const firebaseFixtures = {
    tests: {
        testData: {
            defaultKey1: {
                text: 'previously indexed item',
                customId: 'customKey1',
                numberField: 42,
                updatedAt: now - 200
            },
            defaultKey2: {
                text: 'another item',
                customId: 'customKey2',
                numberField: 42,
                updatedAt: now - 100
            }
        },
        newTestData: {
            defaultKey3: {
                text: 'new item',
                customId: 'customKey2',
                numberField: 42,
                updatedAt: now
            }
        }
    }
};


//
// The tests
//

describe('Indexing a Firebase dataset', function() {
    // Take your time, baby (10min/test)
    this.timeout(10 * 60 * 1000);

    let fb, algolia;

    before('Setup Algolia and Firebase test data', function() {

        // Init test data
        const index = algolia.initIndex(`${prefix}_standard_keys`);

        return index.saveObjects(algoliaFixtures)
            .then(task => index.waitTask(task.taskID))
            .then(() => fb
                .child(`${CONFIG.firebase.uid}`)
                .set(firebaseFixtures)
            );

    });

    after('Cleaning up Algolia and Firebase test data', function() {

        const indexesToDelete = [
            `${prefix}_standard_keys`,
            `${prefix}_standard_keys_temp`
        ];

        const firebaseToDelete = [
            `${CONFIG.firebase.uid}/tests`,
            `${CONFIG.firebase.uid}/${prefix}_standard_keys`
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


    it('should sync Algolia index with Firebase data', function() {

        const index = algolia.initIndex(CONFIG.schema.test.index);

        const args = {
            CONFIG,
            dataset: CONFIG.schema.test,
            fb,
            algolia
        };

        return reindex(args)
            .then(ts => {

                expect(ts).to.equal(now - 100);

                return index.search();
            })
            .then(res => {

                expect(res.nbHits).to.equal(2);

            });
    });


    it('should complete Algolia index with newer Firebase data', function() {

        const index = algolia.initIndex(CONFIG.schema.test.index);

        const args = {
            ts: now - 100,
            CONFIG,
            dataset: CONFIG.schema.test,
            fb,
            algolia
        };

        // First add a new item to firebase, then call again addToIndex with ts
        return fb.child(`${CONFIG.firebase.uid}/tests/testData/defaultKey3`)
            .set(firebaseFixtures.tests.newTestData.defaultKey3)
            .then(() => reindex(args))
            .then(ts => {

                expect(ts).to.equal(now);

                return index.search();
            })
            .then(res => {

                expect(res.nbHits).to.equal(3);

            });
    });


});
