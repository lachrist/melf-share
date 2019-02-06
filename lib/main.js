
const Serialize = require("./serialize.js");
const Instantiate = require("./instantiate.js");
const Virtualize = require("./virtualize.js");
const ReflectAsync = require("./reflect-async.js");

module.exports = (melf, options) => {
  const oids = new Map();
  const refs = new Map();
  const reflect = options.synchronous ? Reflect : ReflectAsync(oids, melf.alias);
  const virtualize = {__proto__:null};
  const serialize = Serialize(oids, refs, melf.alias);
  const instantiate = Instantiate(oids, refs, virtualize);
  Object.assign(virtualize, Virtualize(melf, serialize, instantiate, reflect, options.namespace));
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
