import Debug from 'debug';

/* istanbul ignore if */
if (!Debug.enabled('quiet')) {
    // Note: this must be called before any call to `Debug('info')`
    Debug.enable('info*');
}

export default Debug;
