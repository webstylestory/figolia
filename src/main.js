import prettyjson from 'prettyjson';
import Promise from 'bluebird';

import Debug from './debug';
import initServices from './init-services';
import reindex from './reindex';
import liveIndex from './live-index';
import getLastTimestamp from './get-last-timestamp';

const info = Debug('figolia:info:main');
const debug = Debug('main');

// Main server
function main(CONFIG) {

    const envName = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT';
    info(`Starting server in ${envName} environment.`);

    debug('Current config: ');
    debug(prettyjson.render(CONFIG));

    return initServices(CONFIG).then(services =>
        // For each configured dataset, process indexing
        Promise.all(Object.keys(CONFIG.schema).map(key => {

            const dataset = CONFIG.schema[key];

            // First try to get last indexing time for this dataset
            return getLastTimestamp({ CONFIG, dataset, ...services })
                // Then, reindex all objects from this timestamp, or everything
                .then(ts => reindex({ ts, CONFIG, dataset, ...services }))
                // Then, setup CRUD listeners to continue indexing future events
                .then(ts => liveIndex({ CONFIG, dataset, ...services }));
        }))
    );

}

export default main;
