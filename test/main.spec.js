import { expect } from 'chai';
import { maxBy as _maxBy, cloneDeep as _cloneDeep } from 'lodash';
import prettyjson from 'prettyjson';

import initServices from '../src/init-services';
import main from '../src/main.js';

// Environment variables must be provided for the tests to work

const now = Date.now();
const prefix = `ALGOLIA_FIREBASE_INDEXER_TEST_${now}`;

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

describe('Calling main program', function() {
    // Take your time, baby (10min/test)
    this.timeout(10 * 60 * 1000);

    let fb, algolia;

    before('Initialize services, setup Algolia and Firebase test data', function() {

        // Init services and test data
        return initServices(CONFIG).then(services => {
            fb = services.fb;
            algolia = services.algolia;
            const index = algolia.initIndex(`${prefix}_standard_keys`);

            return index.saveObjects(algoliaFixtures)
                .then(task => index.waitTask(task.taskID))
                .then(() => fb
                    .child(`${CONFIG.firebase.uid}`)
                    .set(firebaseFixtures)
                );
        });

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

    it('should fully sync Firebase to empty index, without timestamp field', function() {

        let simpleConfig = _cloneDeep(CONFIG);
        simpleConfig.schema.test.timestampField = null;

        const index = algolia.initIndex(CONFIG.schema.test.index);

        return fb.child(`${CONFIG.firebase.uid}/tests/testData/defaultKey3`)
            .set(firebaseFixtures.tests.newTestData.defaultKey3)
            .then(() => main(simpleConfig))
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(3);

            });

    })

    it('should clear and resync Firebase to existing index, without timestamp field', function() {

        let simpleConfig = _cloneDeep(CONFIG);
        simpleConfig.schema.test.timestampField = null;

        const index = algolia.initIndex(CONFIG.schema.test.index);

        return fb.child(`${CONFIG.firebase.uid}/tests/testData/defaultKey3`)
            .remove()
            .then(() => main(simpleConfig))
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(2);

            });

    })

    it('with timestampField, should sync Algolia index with Firebase data and store timestamp', function() {

        const index = algolia.initIndex(CONFIG.schema.test.index);

        return main(CONFIG)
            .then(() => fb
                .child(`${CONFIG.firebase.uid}/${prefix}_standard_keys/ts`)
                .once('value')
            )
            .then(fbRef => {

                expect(fbRef.val()).to.equal(now - 100);

                return index.search();
            })
            .then(res => {

                expect(res.nbHits).to.equal(2);

            });
    });

    it('with tiestampField, should add Firebase additional data to index', function() {

        const index = algolia.initIndex(CONFIG.schema.test.index);

        return fb.child(`${CONFIG.firebase.uid}/tests/testData/defaultKey3`)
            .set(firebaseFixtures.tests.newTestData.defaultKey3)
            .then(() => main(CONFIG))
            .then(() => fb
                .child(`${CONFIG.firebase.uid}/${prefix}_standard_keys/ts`)
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

    it('should clear and resync Firebase to existing index, with reset switch, and launch live index with liveIndex switch', function() {

        let resetConfig = {
            ...CONFIG,
            reset: true,
            liveIndex: true
        };

        const index = algolia.initIndex(CONFIG.schema.test.index);

        return fb.child(`${CONFIG.firebase.uid}/tests/testData/defaultKey3`)
            .remove()
            .then(() => main(resetConfig))
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(2);

            });

    });

});
