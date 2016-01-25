import { expect } from 'chai';
import {
    findIndex as _findIndex,
    maxBy as _maxBy
} from 'lodash';

import initServices from '../src/init-services';
import fullReindex from '../src/full-reindex';
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
                customId: 'customKey1',
                text: 'blabla champagne blabla',
                numberField: 42,
                stringField: 'this is a test',
                modifiedAt: now
            },
            defaultKey2: {
                customId: 'customKey2',
                text: 'blabla wine blabla',
                numberField: 42,
                stringField: 'this is a test',
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
                ])
                .then(results => {
                    // Only wait th last item for faster processing
                    let longestItem = _maxBy(results, 'taskID');
                    return index.waitTask(longestItem.taskID);
                })
                .then(() => fb
                    .child(`${baseConfig.firebase.uid}`)
                    .set(firebaseFixtures)
                );
        });
    });

    after('Cleaning up Algolia and Firebase test data', function() {

        const indexesToDelete = [
            `${prefix}_standard_keys`,
            `${prefix}_missing_index`,
            `${prefix}_standard_keys_fields`,
            `${prefix}_custom_keys`,
            // Also try to delete temp indexes, just in case
            `${prefix}_standard_keys_temp`,
            `${prefix}_missing_index_temp`,
            `${prefix}_standard_keys_fields_temp`,
            `${prefix}_custom_keys_temp`
        ];

        const firebaseToDelete = [
            `${baseConfig.firebase.uid}/tests`,
            `${baseConfig.firebase.uid}/${prefix}_standard_keys`,
            `${baseConfig.firebase.uid}/${prefix}_missing_index`,
            `${baseConfig.firebase.uid}/${prefix}_standard_keys_fields`,
            `${baseConfig.firebase.uid}/${prefix}_custom_keys`
        ];

        // Remove test data
        return Promise.all(
                indexesToDelete.map(index => algolia.deleteIndex(index))
            )
            .then(results => {
                // We first need to know at which index of the results is the
                // greatest taskID, in order to only wait for this one
                // so the whole process is a lot faster than waiting for all
                // deletions.
                let { idx, taskID } = results.reduce((prev, curr, idx) => {
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

        fullReindex({ CONFIG, dataset: { path: 'any' }, fb, algolia: null })
            .catch(err => {
                expect(err).to.be.instanceof(Error);
                done();
            });

    });

    it('should create Algolia index, if missing', function() {
        CONFIG.schema.missingIndex = {
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_missing_index`
        };

        const args = {
            CONFIG,
            dataset: CONFIG.schema.missingIndex,
            fb,
            algolia
        };

        return fullReindex(args)
            .then(() => algoliaIndexExists({
                indexName: CONFIG.schema.missingIndex.index,
                algolia
            }))
            .then(indexExists => {

                expect(indexExists).to.equal(true);

            });
    });

    it('should empty Algolia index if Firebase path is missing or empty', function() {
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

        return fullReindex(args)
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(0)

            });
    });

    it('should sync Algolia with Firebase (standard key, all fields)', function() {
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

        const index = algolia.initIndex(CONFIG.schema.standardKeys.index);

        return fullReindex(args)
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(2);
                // There is `_highlightResult` field in addition to object fileds
                expect(Object.keys(res.hits[0]).length).to.equal(7);
                expect(res.hits[0].objectID).to.match(/default/);

            });
    });

    it('should sync Algolia with Firebase (standard key, specific fields)', function() {
        CONFIG.schema.standardKeysFields = {
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_standard_keys_fields`,
            fields: ['text', 'numberField']
        };

        const args = {
            CONFIG,
            dataset: CONFIG.schema.standardKeysFields,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.standardKeysFields.index);

        return fullReindex(args)
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(2);
                // Only 4 fields, including `_highlightResult`
                expect(Object.keys(res.hits[0]).length).to.equal(4);
                expect(res.hits[0].objectID).to.match(/default/);

            });

    });

    it('should sync Algolia with Firebase (custom key, all fields)', function() {
        CONFIG.schema.customKeys = {
            path: `${baseConfig.firebase.uid}/tests/testData`,
            index: `${prefix}_custom_keys`,
            key: 'customId'
        };

        const args = {
            CONFIG,
            dataset: CONFIG.schema.customKeys,
            fb,
            algolia
        };

        const index = algolia.initIndex(CONFIG.schema.customKeys.index);

        return fullReindex(args)
            .then(() => index.search())
            .then(res => {

                expect(res.nbHits).to.equal(2);
                expect(Object.keys(res.hits[0]).length).to.equal(7);
                expect(res.hits[0].objectID).to.match(/custom/);

            });
    });

    it('should store last object timestamp', function() {
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

        const index = algolia.initIndex(CONFIG.schema.standardKeys.index);

        return fullReindex(args)
            .then(() => fb.child(
                    `${CONFIG.firebase.uid}/${CONFIG.schema.standardKeys.index}/ts`
                ).once('value'))
            .then(res => {

                expect(res.val()).to.equal(now);

            })
    });

    it('should keep algolia index settings', function() {
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

        let index = algolia.initIndex(CONFIG.schema.standardKeys.index);

        let previousSettings;

        return index.getSettings()
            .then(settings => {
                previousSettings = settings;
                return fullReindex(args);
            })
            .then(() => index.getSettings())
            .then(settings => {

                expect(settings).to.deep.equal(previousSettings);

            });
    });

});

