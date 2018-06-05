
const Traps = require("./traps.js");
const Default = require("./default.js");
const Serialize = require("./serialize.js");
const Instantiate = require("./instantiate.js");

module.exports = (melf, synchronous) => {
  const keys = new Map();
  const values = new Map();
  return {
    ownerof: (value) => {
      const key = keys.get(value);
      return key ? key.split("/")[0] : melf.alias
    },
    serialize: Serialize(melf.alias, keys, values);
    instantiate: Instantiate(Traps(melf, synchronous), keys, values);
  };
};

module.exports.default = require("./default.js");
