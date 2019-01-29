
const Serialize = require("./serialize.js");
const Instantiate = require("./instantiate.js");
const Virtual = require("./virtual.js");

module.exports = (melf, options) => {
  const keys = new Map();
  const values = new Map();
  const virtual = {__proto__:null};
  const serialize = Serialize(keys, values, melf.alias);
  const instantiate = Instantiate(keys, values, virtual);
  Object.assign(virtual, Virtual(melf, serialize, instantiate, options));
  return {
    owner: (value) => {
      const key = keys.get(value);
      return key ? key.split("|")[0] : melf.alias;
    },
    discard: (value) => {
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
