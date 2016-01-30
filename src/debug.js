import Debug from 'debug';

/* istanbul ignore if */
if (!Debug.enabled('quiet')) {
    // Note: this must be called before any call to `Debug('figolia:info')`, hence
    // the need to have this custom file to call in other source files
    Debug.enable('figolia:info*');
}

export default Debug;
