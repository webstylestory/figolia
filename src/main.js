import init from './init';
import fullReindex from './full-reindex';

// Main server
const main = (CONFIG) => {

    const { fb, algolia } = init(CONFIG);

    const envName = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT';
    info(`Starting server in ${envName} environment.`);

    debug('Current config: ');
    debug(prettyjson.render(CONFIG));

    for (let key in CONFIG.schema) {

        let dataset = CONFIG.schema[key];

        // let promise = getLastIndexingTime(dataset);

        // if (!promise) {
        //     promise = fullReindex(dataset);
        // }

        // promise
        //     .then(listenFirebaseForIndexing)
        //     .catch(err => console.error(err));

        fullReindex({ CONFIG, dataset, fb, algolia });

    }
};

export default main;
