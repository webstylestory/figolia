// Erase all items from an Algolia index

const clearAlgoliaIndex = function({ CONFIG, algolia, index }) {
    if (!algo) {
        throw new Error('Algolia instance was not found');
    };
    if (!index) {
        throw new Error('Algolia index to clear was not found');
    };

};

export default clearAlgoliaIndex;
