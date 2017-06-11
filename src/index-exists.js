import { findIndex as _findIndex } from 'lodash';

//
// Check if a specified Algolia index exists
//
// @return Promise which resolves to boolean
//
const indexExists = ({ indexName, algolia }) => {

    return algolia.listIndexes().then(res => {

        let indexFound = _findIndex(
            res.items,
            ['name', indexName]
        );

        return indexFound !== -1;
    });
};

export default indexExists;
