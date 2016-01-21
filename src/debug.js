import Debug from 'debug';

if (!Debug.enabled('quiet')) {
    // Note: this must be called before any call to `Debug('info')`
    Debug.enable('info*');
}

export default Debug;
