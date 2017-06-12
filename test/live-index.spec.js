import Promise from 'bluebird';
import { expect } from 'chai';
import { maxBy as _maxBy } from 'lodash';
import prettyjson from 'prettyjson';

import initServices from '../src/init-services';
import reindex from '../src/reindex.js';
import liveIndex from '../src/live-index.js';

// Helper function that returns a Promise which resolves ater a delay
const waitFor = seconds => {
    let deferred = Promise.defer();
    setTimeout(deferred.resolve.bind(deferred), seconds * 1000);
    return deferred.promise;
};

// Environment variables must be provided for the tests to work

const now = Date.now();
const prefix = `ALGOLIA_FIREBASE_INDEXER_TEST_${now}`;

const { fb, algolia } = initServices();

const CONFIG = {
    ...global.CONFIG,
    liveIndex: true,
    throttleDelay: 10,
    schema: {
        test: {
            timestampField: 'updatedAt',
            path: 'algolia/tests/testData',
            index: `${prefix}_standard_keys`
        },
        test2: {
            timestampField: 'updatedAt',
            path: 'algolia/tests/testData',
            index: `${prefix}_standard_keys_2`
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

describe('Live indexing of a Firebase dataset to Algolia', function() {
    // Take your time, baby (10min/test)
    this.timeout(10 * 60 * 1000);

    before('Setup Algolia and Firebase test data', function() {

        // Init test data
        const index = algolia.initIndex(`${prefix}_standard_keys`);

        return index.saveObjects(algoliaFixtures)
            .then(task => index.waitTask(task.taskID))
            .then(() => fb
                .child(`${CONFIG.firebase.uid}`)
                .set(firebaseFixtures)
            )
            // Index the two set of data
            .then(() => Promise.all([
                reindex({
                    CONFIG,
                    dataset: CONFIG.schema.test,
                    fb,
                    algolia
                }),
                reindex({
                    CONFIG,
                    dataset: CONFIG.schema.test2,
                    fb,
                    algolia
                })
            ]))
            // Start live indexing both datasets
            .then(() => {
                liveIndex({
                    ts: now - 100,
                    CONFIG,
                    dataset: CONFIG.schema.test,
                    fb,
                    algolia
                });
                liveIndex({
                    ts: now - 100,
                    CONFIG,
                    dataset: CONFIG.schema.test2,
                    fb,
                    algolia
                });
            });

    });

    after('Cleaning up Algolia and Firebase test data', function() {

        const indexesToDelete = [
            `${prefix}_standard_keys`,
            `${prefix}_standard_keys_temp`,
            `${prefix}_standard_keys_2`,
            `${prefix}_standard_keys_temp_2`
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
            // Stop listening to Firebase changes
            .then(() => {
                fb.child(CONFIG.schema.test.path).off();
            })
            // Remove test data in firebase
            .then(() => Promise.all(
                firebaseToDelete.map(path => fb.child(path).remove())
            ));

    });

    it('should return null if no timestamp provided', function() {

        expect(liveIndex({ ts: null, dataset: { path: 'test' } })).to.be.null;

    });

    it('should add Firebase additional data to index and update timestamp', function() {

        const index = algolia.initIndex(CONFIG.schema.test.index);

        return fb.child(`${CONFIG.firebase.uid}/tests/testData/defaultKey3`)
            .set(firebaseFixtures.tests.newTestData.defaultKey3)
            .then(() => waitFor(45))
            .then(() => fb.child(`${CONFIG.firebase.uid}/${prefix}_standard_keys/ts`)
                .once('value')
            )
            .then(fbRef => {

                expect(fbRef.val()).to.equal(now);

                return index.search();
            })
            .then(res => {

                expect(res.nbHits).to.equal(3);

            });
    });

    it('should delete removed Firebase data from index', function() {

        const index = algolia.initIndex(CONFIG.schema.test.index);

        return fb.child(`${CONFIG.firebase.uid}/tests/testData/defaultKey2`)
            .remove()
            .then(() => waitFor(45))
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(2);

            });
    });


});
