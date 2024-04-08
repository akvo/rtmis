const flipObject = (obj) =>
  Object.keys(obj).reduce((flipped, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      flipped[obj[key]] = key;
    }
    return flipped;
  }, {});

const helpers = {
  flipObject,
};

export default helpers;
