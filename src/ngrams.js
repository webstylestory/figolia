import { uniq as _uniq } from 'lodash';

const ngrams = str => {
    let ngrams = [];

    if (typeof str !== 'string') {
        return ngrams;
    }

    // apply on each words, not all string
    let words = str.split(/[^\w]/g);

    words.forEach(word => {
        // get the ngrams only down to 4 characters, otherwise pertinence fall
        for (let pos = word.length - 4; pos > 0; pos--) {
            ngrams.push(word.slice(pos))
        }
    });

    return _uniq(ngrams);
};

export default ngrams;
