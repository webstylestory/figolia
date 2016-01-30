import Debug from './debug';

const info = Debug('info:remove-from-index');
const debug = Debug('remove-from-index');

//
// Delete an object from the index based on firebase snapshot
// This should only be used as a 'child_removed' firebase callback
//
const deleteFromIndex = ({ fbRef, CONFIG, dataset, fb, algolia }) => {

  const objectID = dataset.key ? fbRef.val()[dataset.key] : fbRef.key();

  info(`Removing ${dataset.path} from index with objectID ${objectID}`);

  const index = algolia.initIndex(dataset.index);

  // Remove the object from Algolia
  return index.deleteObject(objectID)
    .then(task => index.waitTask(task.taskID))
    .then(() => debug(`Done removing ${dataset.path} objectID ${objectID}`))

};

export default deleteFromIndex;
