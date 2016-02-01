import Debug from './debug';

const info = Debug('figolia:info:remove-from-index');
const debug = Debug('figolia:remove-from-index');

//
// Delete objects from the index based on firebase snapshot
// This should only be used as a 'child_removed' firebase callback
//
// @return Promise
//
const removeFromIndex = ({ firebaseObjects, CONFIG, dataset, fb, algolia }) => {

  let objectIDs = [];
  for (let key in firebaseObjects) {
    objectIDs.push(dataset.key ? firebaseObjects[key][dataset.key] : key);
  }

  info(`Removing ${objectIDs.length} items from ${dataset.path}`);

  const index = algolia.initIndex(dataset.index);

  // Remove the object from Algolia
  return index.deleteObjects(objectIDs)
    .then(task => index.waitTask(task.taskID))
    .then(() => debug(`Done removing ${objectIDs.length} items from ${dataset.path}`))

};

export default removeFromIndex;
