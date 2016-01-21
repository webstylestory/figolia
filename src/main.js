import prettyjson from 'prettyjson';

import Debug from './debug';
import initServices from './init-services';
import fullReindex from './full-reindex';

const info = Debug('info:main');
const debug = Debug('main');

// Main server
function main(CONFIG) {

    const { fb, algolia } = initServices(CONFIG);

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
}

export default main;
