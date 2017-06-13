import prettyjson from 'prettyjson';
import Promise from 'bluebird';

import Debug from './debug';
import reindex from './reindex';
import initServices from './init-services';
import liveIndex from './live-index';
import getLastTimestamp from './get-last-timestamp';

const info = Debug('figolia:info:main');
const debug = Debug('figolia:main');

// Main server
function main(CONFIG) {

    const services = initServices();
    const envName = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT';
    info(`Starting Figolia v${CONFIG.version} in ${envName} environment.`);

    debug('Current config: ');
    debug(prettyjson.render(CONFIG));

    // For each configured dataset, process indexing
    return Promise.all(Object.keys(CONFIG.schema).map(key => {

        const dataset = CONFIG.schema[key];
        info(`Starting indexing ${dataset.path}`);

        // First try to get last indexing time for this dataset
        // except if user expicitely ask for a full reset
        let promise = CONFIG.reset ?
            Promise.resolve() :
            getLastTimestamp({ CONFIG, dataset, ...services });

        // Then, reindex all objects from this timestamp, or everything
        promise = promise
            .then(ts => reindex({ ts, CONFIG, dataset, ...services }))
            .then(ts => {
                info(`Done indexing ${dataset.path}`);
                return ts;
            });

        // If no live indexing is demanded, stop there
        if (!CONFIG.liveIndex) {
            return promise;
        }

        // Setup CRUD listeners to continue indexing future events
        return promise
            .then(ts => {
                info(`Starting live indexing ${dataset.path}...`);
                info('(The server will now never stop by itself, please hit CTRL-C to force exit)');
                return ts;
            })
            .then(ts => liveIndex({ ts, CONFIG, dataset, ...services }));

    }));

}

export default main;
