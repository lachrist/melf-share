
const Handlers = require("./handlers.js");
const Serialize = require("./serialize.js");
const Instantiate = require("./instantiate.js");

module.exports = (melf, options) => {
  const keys = new Map();
  const values = new Map();
  const handlers = Object.create(null);
  const serialize = Serialize(melf.alias, keys, values);
  const instantiate = Instantiate(handlers, keys, values);
  Handlers(handlers, melf, options, values, serialize, instantiate);
  return {
    owner: (value) => {
      const key = keys.get(value);
      return key ? key.split("/")[0] : melf.alias;
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
