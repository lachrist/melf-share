
const Reference = require("./reference.js");
const Serialize = require("./serialize.js");
const Instantiate = require("./instantiate.js");

module.exports = (melf, options) => {
  options = options || {};
  options.sync = options.sync || false;
  const reference = Reference(melf, options);
  const serialize = Serialize(reference.serialize);
  const instantiate = Instantiate(reference.instantiate);
  reference.resolve_serialize(serialize);
  reference.resolve_instantiate(instantiate);
  return {
    ownerof: reference.ownerof,
    serialize: serialize;
    instantiate: instantiate
  };
};
