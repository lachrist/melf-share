
const Far = require("./far.js");
const Serialize = require("./serialize.js");
const Instantiate = require("./instantiate.js");

module.exports = (melf, synchronous) => {
  const keys = new Map();
  const values = new Map();
  const far = Far(melf, synchronous, values);
  const serialize = Serialize(melf.alias, keys, values);
  const instantiate = Instantiate(far, keys, values);
  far.resolve(serialize, instantiate);
  return {
    ownerof: (value) => {
      const key = keys.get(value);
      return key ? key.split("/")[0] : melf.alias;
    },
    delete: (value) => {
      const key = keys.get(value);
      if (key) {
        keys.delete(value);
        values.delete(key);
      }
      return Boolean(key);
    },
    serialize: serialize,
    instantiate: instantiate
  };
};
