import { findIndex as _findIndex } from 'lodash';

//
// Check if a specified index exists
//
// @return Promise which resolves to boolean
//
const algoliaIndexExists = ({ indexName, algolia }) => {

    // Make sure we get the indexes online
    algolia.clearCache();

    return algolia.listIndexes().then(res => {

        let indexFound = _findIndex(
            res.items,
            ['name', indexName]
        );

        return indexFound !== -1;
    })
};

export default algoliaIndexExists;
