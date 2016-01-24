import { expect } from 'chai';
import initServices from '../src/init-services';

// Helper function to `expect` functions with args
// Usage : expectCalling(myFunc).withArgs('badArg').to.throw(/gtfo/)
let expectCalling = func => ({ withArgs: (...args) => expect(() => func(...args)) });

const badConfig = {
    firebase: {
        instance: '',
        secret: ''
    },
    algolia: {
        applicationId: '',
        apiKey: ''
    }
}

// Environment variables must be provided for the tests to work
const goodConfig = {
    firebase: {
        instance: process.env.FIREBASE_INSTANCE,
        secret: process.env.FIREBASE_SECRET,
        path: process.env.FIREBASE_PATH || 'algolia',
        uid: process.env.FIREBASE_UID || 'algolia'
    },
    algolia: {
        applicationId: process.env.ALGOLIA_APP_ID,
        apiKey: process.env.ALGOLIA_API_KEY
    }
}

describe('Third party services initialization (THIS TEST NEEDS ENVIRONMENT VARIABLES, SEE README.md)', () => {

        let config;

        beforeEach(() => {
            config = { ...goodConfig };
        });

        it('should init Firebase correctly with a valid config', done => {
            expectCalling(initServices).withArgs(config).to.not.throw(Error);
            const { fb } = initServices(config);
            fb.child('.info').once('value', data => {
                expect(data.val()).to.be.ok;
                done();
            });
        });

        it('should connect to Algolia with a valid config', done => {
            expectCalling(initServices).withArgs(config).to.not.throw(Error);
            const { algolia } = initServices(config);
            algolia.listIndexes(done);
        });

        it('should throw if Firebase values are missing from config', done => {
            config.firebase = badConfig.firebase;
            expectCalling(initServices).withArgs(config).to.throw(/firebase/);
            done();
        });

        it('should throw if Algolia values are missing from config', done => {
            config.algolia = badConfig.algolia;
            expectCalling(initServices).withArgs(config).to.throw(/algolia/);
            done();
        });

});

