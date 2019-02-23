
const Serialize = require("./serialize.js");
const Instantiate = require("./instantiate.js");
const VirtualizeSync = require("./virtualize-sync.js");
const VirtualizeAsync = require("./virtualize-async.js");
const ReflectAsync = require("./reflect-async.js");
const ReflectSync = require("./reflect-sync.js");

module.exports = (melf, options) => {
  const oids = new Map();
  const refs = new Map();
  const reflect = options.synchronous ? ReflectSync : ReflectAsync(oids, melf.alias);
  const virtualize = {__proto__:null};
  const serialize = Serialize(oids, refs, melf.alias);
  const instantiate = Instantiate(oids, refs, virtualize);
  if (options.synchronous)
    Object.assign(virtualize, VirtualizeSync(melf, serialize, instantiate, options.namespace));
  else
    Object.assign(virtualize, VirtualizeAsync(melf, serialize, instantiate, reflect, options.namespace));
  return {
    reflect,
    serialize,
    instantiate,
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
