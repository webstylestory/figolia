import prettyjson from 'prettyjson';
import Promise from 'bluebird';

import Debug from './debug';
import initServices from './init-services';
import reindex from './reindex';
import liveIndex from './live-index';
import getLastTimestamp from './get-last-timestamp';

const info = Debug('info:main');
const debug = Debug('main');

// Main server
function main(CONFIG) {

    const envName = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT';
    info(`Starting server in ${envName} environment.`);

    debug('Current config: ');
    debug(prettyjson.render(CONFIG));

    return initServices(CONFIG).then(services =>
        Promise.all(Object.keys(CONFIG.schema).map(key => {

            const dataset = CONFIG.schema[key];

            return getLastTimestamp({ CONFIG, dataset, ...services })
                .then(ts => reindex({ ts, CONFIG, dataset, ...services }))
                .then(ts => liveIndex({ CONFIG, dataset, ...services }));
        }))
    );

}

export default main;
