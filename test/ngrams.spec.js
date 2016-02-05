import { expect } from 'chai';

import ngrams from '../src/ngrams';

describe('Computing NGrams of a string', function() {

    it('should return empty array with argument other than string', function() {

        expect(ngrams(32)).to.eql([]);
        expect(ngrams({ test: 'hello' })).to.eql([]);
        expect(ngrams(null)).to.eql([]);

    });

    it('should return empty array with string length between 0 and 3', function() {

        expect(ngrams('')).to.eql([]);
        expect(ngrams('ab')).to.eql([]);
        expect(ngrams('abcd')).to.eql([]);

    });

    it('should return correct ngram for a single word with length above 3', function() {

        expect(ngrams('hermione'))
            .to.eql(['ione', 'mione', 'rmione', 'ermione']);

    });

    it('should return correct ngram for a multiple words, exclude non-word characters', function() {

        expect(ngrams('miss hermione granger!'))
            .to.eql([
                'ione', 'mione', 'rmione', 'ermione',
                'nger', 'anger', 'ranger',
            ]);

    });


    it('should not return duplicate ngrams', function() {

        expect(ngrams('hermione, aka mione'))
            .to.eql(['ione', 'mione', 'rmione', 'ermione']);

    });

});
