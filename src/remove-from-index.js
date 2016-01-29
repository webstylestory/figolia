
//
// Delete an object from the index based on firebase snapshot
// This should only be used as a 'child_removed' firebase callback
//
const deleteFromIndex = ({ fbRef, CONFIG, dataset, fb, algolia }) => {

  const objectID = dataset.key ? fbRef.val()[dataset.key] : fbRef.key();

  const index = algolia.initIndex(dataset.index);

  // Remove the object from Algolia
  return index.deleteObject(objectID)
    .then(task => index.waitTask(task.taskID));

};

export default deleteFromIndex;
