const SharedObject = require("./shared-object.js");
const SharedSymbol = require("./shared-symbol.js");
const Serialize = require("./serialize.js");
const Instantiate = require("./instantiate.js");

module.exports = (melf, synchronous) => {
  const sobject = SharedObject(melf, synchronous);
  const ssymbol = SharedSymbol(melf);
  const serialize = Serialize(sobject.serialize, ssymbol.serialize);
  const instantiate = Instantiate(sobject.instantiate, ssymbol.instantiate);
  sobject.resolve_serialize(serialize);
  sobject.resolve_instantiate(instantiate);
  return {
    ownerof: (value) => shared_object.ownerof(value) || shared_symbol.ownerof(value) || melf.alias,
    serialize: serialize;
    instantiate: instantiate
  };
};

module.exports.default = require("./default.js");

  const register = (key, value) => {
    keyof.set(key, value)
    valueof.set(value, key);
    return proxy;
  };