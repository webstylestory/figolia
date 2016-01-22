import { expect } from 'chai';
import Debug from '../src/debug';

// Skiped because tests are run in quiet mode, disabling info debugger...
describe.skip('Debug tool', () => {

    it('should enable "info*" debugging by default', () => {
        expect(Debug.enabled('info')).to.equal(true);
    });

});

