
const Serialize = require("./serialize.js");
const Instantiate = require("./instantiate.js");
const VirtualizeSync = require("./virtualize-sync.js");
const VirtualizeAsync = require("./virtualize-async.js");

module.exports = (melf, options) => {
  const oids = new Map();
  const refs = new Map();
  const virtualize = {__proto__:null};
  const serialize = Serialize(oids, refs, melf.alias);
  const instantiate = Instantiate(oids, refs, virtualize);
  Object.assign(virtualize, (options.synchronous ? VirtualizeSync : VirtualizeAsync)(melf, serialize, instantiate, options.namespace));
  return {
    serialize,
    instantiate,
    reflect: virtualize.reflect,
    ownerof: (value) => {
      const oid = oids.get(value);
      return oid ? oid.split("|")[0] : melf.alias;
    },
    discard: (value) => {
      const oid = oids.get(value);
      if (oid) {
        oids.delete(value);
        refs.delete(id);
      }
      return Boolean(oid);
    }
  };
};
