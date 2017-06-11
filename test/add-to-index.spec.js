import { expect } from 'chai';
import { maxBy as _maxBy } from 'lodash';

import { fb, algolia } from '../src/init-services';
import addToIndex from '../src/add-to-index';
import indexExists from '../src/index-exists.js';

// Helper function to `expect` functions with args
// Usage : `expectCalling(myFunc).withArgs('badArg').to.throw(/gtfo/)`
let expectCalling = func => ({ withArgs: (...args) => expect(() => func(...args)) });


// Environment variables must be provided for the tests to work

const baseConfig = {
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

// const algoliaSettings =  {
//     ranking: ['typo', 'geo', 'words']
// };

const firebaseObjects = {
    defaultKey1: {
        text: 'previously indexed object',
        ngrams: 'whatever',
        customId: 'customKey1',
        numberField: 42,
        updatedAt: now - 200
    },
    defaultKey2: {
        text: 'first new object',
        ngrams: 'whatever',
        customId: 'customKey2',
        numberField: 42,
        updatedAt: now - 100
    },
    defaultKey3: {
        text: 'earliest new object',
        ngrams: 'whatever',
        customId: 'customKey3',
        numberField: 42,
        updatedAt: now
    }
};


//
// The tests
//

describe('Indexing a group of objects', function() {
    // Take your time, baby (10min/test)
    this.timeout(10 * 60 * 1000);

    let fb, algolia, CONFIG = baseConfig;

    before('Setup Algolia and Firebase test data', function() {

        // Init test data
        const index = algolia.initIndex(`${prefix}_standard_keys`);
        return index.saveObjects(algoliaFixtures)
            .then(task => index.waitTask(task.taskID));

    });

    after('Cleaning up Algolia and Firebase test data', function() {

        const indexesToDelete = [
            `${prefix}_standard_keys`,
            `${prefix}_missing_index`,
            `${prefix}_standard_keys_ngrams`,
            `${prefix}_standard_keys_inclusion`,
            `${prefix}_standard_keys_exclusion`,
            `${prefix}_standard_keys_bothclusion`,
            `${prefix}_custom_keys`,
            `${prefix}_standard_keys_timestamp`,
            // Also try to delete temp indexes, just in case
            `${prefix}_standard_keys_temp`,
            `${prefix}_missing_index_temp`,
            `${prefix}_standard_keys_inclusion_temp`,
            `${prefix}_standard_keys_exclusion_temp`,
            `${prefix}_standard_keys_bothclusion_temp`,
            `${prefix}_custom_keys_temp`,
            `${prefix}_standard_keys_timestamp_temp`
        ];

        const firebaseToDelete = [
            // `${baseConfig.firebase.uid}/tests`,
            `${baseConfig.firebase.uid}/${prefix}_standard_keys`,
            `${baseConfig.firebase.uid}/${prefix}_missing_index`,
            `${baseConfig.firebase.uid}/${prefix}_standard_keys_ngrams`,
            `${baseConfig.firebase.uid}/${prefix}_standard_keys_inclusion`,
            `${baseConfig.firebase.uid}/${prefix}_standard_keys_exclusion`,
            `${baseConfig.firebase.uid}/${prefix}_standard_keys_bothclusion`,
            `${baseConfig.firebase.uid}/${prefix}_custom_keys`,
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

    it('should throw an error if services are missing', function() {

        const args = {
            firebaseObjects,
            CONFIG,
            dataset: { path: 'any' },
            fb,
            algolia: null
        };

        expectCalling(addToIndex)
            .withArgs(args)
            .to.throw(Error);

    });

    it('should create Algolia index, if missing', function() {
        CONFIG.schema.missingIndex = {
            timestampField: 'updatedAt',
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_missing_index`
        };

        const args = {
            firebaseObjects,
            CONFIG,
            dataset: CONFIG.schema.missingIndex,
            fb,
            algolia
        };

        return addToIndex(args)
            .then(() => indexExists({
                indexName: CONFIG.schema.missingIndex.index,
                algolia
            }))
            .then(indexExists => {

                expect(indexExists).to.equal(true);

            });
    });

    it('should complete Algolia index with additional data', function() {
        CONFIG.schema.emptyPath = {
            timestampField: 'updatedAt',
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_standard_keys`
        };

        const args = {
            firebaseObjects,
            CONFIG,
            dataset: CONFIG.schema.emptyPath,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.emptyPath.index);

        return addToIndex(args)
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(4);

            });
    });


    it('with clearIndex option should fully resync Algolia with Firebase (standard key, all field)', function() {
        CONFIG.schema.standardKeys = {
            timestampField: 'updatedAt',
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_standard_keys`
        };

        const args = {
            clearIndex: true,
            firebaseObjects,
            CONFIG,
            dataset: CONFIG.schema.standardKeys,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.standardKeys.index);

        return addToIndex(args)
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(3);
                // There is `_highlightResult` field in addition to object fileds
                expect(Object.keys(res.hits[0])).to.have.length(7);
                expect(res.hits[0]).to.have.property('objectID')
                    .that.match(/default/);

            });
    });

    it('should empty Algolia index if Firebase path is missing or empty', function() {
        CONFIG.schema.emptyPath = {
            timestampField: 'updatedAt',
            path: `${baseConfig.firebase.uid}/tests/thisPathIsEmpty`,
            index: `${prefix}_standard_keys`
        };

        const args = {
            firebaseObjects: null,
            CONFIG,
            dataset: CONFIG.schema.emptyPath,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.emptyPath.index);

        return addToIndex(args)
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(0);

            });
    });

    it('should sync Algolia with Firebase (standard key, field inclusion filter)', function() {
        CONFIG.schema.standardKeysInclusion = {
            timestampField: 'updatedAt',
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_standard_keys_inclusion`,
            includeFields: ['text', 'numberField']
        };

        const args = {
            firebaseObjects,
            CONFIG,
            dataset: CONFIG.schema.standardKeysInclusion,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.standardKeysInclusion.index);

        return addToIndex(args)
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(3);
                // Only 4 fields, including ObjctID and `_highlightResult`
                expect(Object.keys(res.hits[0])).to.have.length(4);
                expect(res.hits[0]).to.not.have.property('customId');
                expect(res.hits[0]).to.not.have.property('updatedAt');
                expect(res.hits[0]).to.have.property('text');
                expect(res.hits[0]).to.have.property('numberField');
                expect(res.hits[0]).to.have.property('objectID')
                    .that.match(/default/);

            });

    });

    it('should sync Algolia with Firebase (standard key, ngrams for infix search)', function() {
        CONFIG.schema.standardKeysNgrams = {
            timestampField: 'updatedAt',
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_standard_keys_ngrams`,
            ngrams: ['text']
        };

        const args = {
            firebaseObjects,
            CONFIG,
            dataset: CONFIG.schema.standardKeysNgrams,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.standardKeysNgrams.index);

        return addToIndex(args)
            .then(() => index.search('ject'))
            .then(res => {

                expect(res.hits[0]).to.have.property('ngramsFigolia');
                expect(res.nbHits).to.equal(3);

                return index.search('vious');
            })
            .then(res => {

                expect(res.nbHits).to.equal(1);

            });
    });

    it('should sync Algolia with Firebase (standard key, field exclusion filter)', function() {
        CONFIG.schema.standardKeysExclusion = {
            timestampField: 'updatedAt',
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_standard_keys_exclusion`,
            excludeFields: ['numberField', 'text']
        };

        const args = {
            firebaseObjects,
            CONFIG,
            dataset: CONFIG.schema.standardKeysExclusion,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.standardKeysExclusion.index);

        return addToIndex(args)
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(3);
                // 5 fields, including `_highlightResult`
                expect(Object.keys(res.hits[0])).to.have.length(5);
                expect(res.hits[0]).to.not.have.property('text');
                expect(res.hits[0]).to.not.have.property('numberField');
                expect(res.hits[0]).to.have.property('customId');
                expect(res.hits[0]).to.have.property('updatedAt');
                expect(res.hits[0]).to.have.property('objectID')
                    .that.match(/default/);

            });

    });

    it('should sync Algolia with Firebase (standard key, field exclusion filter)', function() {
        CONFIG.schema.standardKeysBothclusion = {
            timestampField: 'updatedAt',
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_standard_keys_bothclusion`,
            includeFields: ['numberField', 'text', 'updatedAt'],
            excludeFields: ['numberField']
        };

        const args = {
            firebaseObjects,
            CONFIG,
            dataset: CONFIG.schema.standardKeysBothclusion,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.standardKeysBothclusion.index);

        return addToIndex(args)
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(3);
                // Only 3 fields, including `_highlightResult`
                expect(Object.keys(res.hits[0])).to.have.length(4);
                expect(res.hits[0]).to.not.have.property('numberField');
                expect(res.hits[0]).to.not.have.property('customId');
                expect(res.hits[0]).to.have.property('updatedAt');
                expect(res.hits[0]).to.have.property('text');
                expect(res.hits[0]).to.have.property('objectID')
                    .that.match(/default/);

            });

    });

    it('should sync Algolia with Firebase (custom key, all fields)', function() {
        CONFIG.schema.customKeys = {
            timestampField: 'updatedAt',
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_custom_keys`,
            key: 'customId'
        };

        const args = {
            firebaseObjects,
            CONFIG,
            dataset: CONFIG.schema.customKeys,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.customKeys.index);

        return addToIndex(args)
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(3);
                expect(Object.keys(res.hits[0])).to.have.length(7);
                expect(res.hits[0]).to.have.property('objectID')
                    .that.match(/custom/);

            });
    });

    // it('should keep algolia index settings when clearing index', function() {
    //     CONFIG.schema.standardKeys = {
    //         path: `${baseConfig.firebase.uid}/tests/testData`,
    //         index: `${prefix}_standard_keys`
    //     };

    //     const args = {
    //         clearIndex: true,
    //         firebaseObjects,
    //         CONFIG,
    //         dataset: CONFIG.schema.standardKeys,
    //         fb,
    //         algolia
    //     };

    //     let index = algolia.initIndex(CONFIG.schema.standardKeys.index);

    //     let previousSettings;

    //     return index.getSettings()
    //         .then(settings => {
    //             previousSettings = settings;
    //             return addToIndex(args);
    //         })
    //         .then(() => index.getSettings())
    //         .then(settings => {

    //             expect(settings).to.deep.equal(previousSettings);

    //         });
    // });

    it('should return timestamp of last object', function() {
        CONFIG.schema.standardKeys = {
            timestampField: 'updatedAt',
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_standard_keys`
        };

        const args = {
            firebaseObjects,
            CONFIG,
            dataset: CONFIG.schema.standardKeys,
            fb,
            algolia
        };

        return addToIndex(args)
            .then(ts => {

                expect(ts).to.equal(now);

            });
    });

    // it('should index only recent items, and return timestamp of last object (timestamp provided)', function() {
    //     CONFIG.schema.standardKeysTs = {
    //         path: `${baseConfig.firebase.uid}/tests/testData`,
    //         index: `${prefix}_standard_keys_timestamp`
    //     };

    //     const timestamp = now - 200;

    //     const args = {
    //         ts: timestamp,
    //         CONFIG,
    //         dataset: CONFIG.schema.standardKeysTs,
    //         fb,
    //         algolia
    //     };

    //     const index = algolia.initIndex(CONFIG.schema.standardKeysTs.index);

    //     return addToIndex(args)
    //         .then(ts => {

    //             expect(ts).to.equal(now);

    //             return index.search();
    //         })
    //         .then(res => {

    //             expect(res.nbHits).to.equal(2);
    //             expect(res.hits[0])
    //                 .to.have.property('updatedAt')
    //                 .that.is.above(timestamp);
    //             expect(res.hits[1])
    //                 .to.have.property('updatedAt')
    //                 .that.is.above(timestamp);

    //         });
    // });

    // it('should index only recent items, if timestamp provided', function() {
    //     CONFIG.schema.standardKeysTs = {
    //         path: `${baseConfig.firebase.uid}/tests/testData`,
    //         index: `${prefix}_standard_keys_timestamp`
    //     };

    //     const timestamp = now - 200;

    //     const args = {
    //         ts: timestamp,
    //         CONFIG,
    //         dataset: CONFIG.schema.standardKeysTs,
    //         fb,
    //         algolia
    //     };

    //     const index = algolia.initIndex(CONFIG.schema.standardKeysTs.index);

    //     return addToIndex(args)
    //         .then(ts => {

    //             expect(ts).to.equal(now);

    //             return index.search();
    //         })
    //         .then(res => {

    //             expect(res.nbHits).to.equal(2);
    //             expect(res.hits[0])
    //                 .to.have.property('updatedAt')
    //                 .that.is.above(timestamp);
    //             expect(res.hits[1])
    //                 .to.have.property('updatedAt')
    //                 .that.is.above(timestamp);

    //         });
    // });

    it('should store last object timestamp', function() {
        CONFIG.schema.standardKeys = {
            timestampField: 'updatedAt',
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_standard_keys`
        };

        const args = {
            CONFIG,
            dataset: CONFIG.schema.standardKeys,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.standardKeys.index);

        return addToIndex(args)
            .then(() => fb.child(
                    `${CONFIG.firebase.uid}/${CONFIG.schema.standardKeys.index}/ts`
                ).once('value'))
            .then(res => {

                expect(res.val()).to.equal(now);

            });
    });

});

