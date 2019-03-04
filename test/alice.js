const Melf = require("melf");
const MelfShare = require("../lib/main.js");
const Primitives = require("./primitives.js");

module.exports = (address) => {
  Melf(address, "alice", (error, melf) => {
    if (error)
      throw error;
    const share1 = MelfShare(melf, {synchronous:true, namespace:"sync"});
    const share2 = MelfShare(melf, {synchronous:false, namespace:"async"});
    const values = Object.assign({
      global: global,
      get array () { return [] },
      get object () { return {__proto__:null} },
      arrow_identity: (x) => x,
      function_this: function () { return this; },
      strict_function_this: function () { "use strict"; return this; },
      symbol_foo: Symbol("foo"),
      symbol_wellknown_iterator: Symbol.iterator,
      symbol_global_foo: Symbol.for("foo"),
      object_symbol_primitive_foo: {__proto__:null, [Symbol.toPrimitive]: () => "foo"},
      object_toString_foo: {__proto__:null, toString: () => "foo"},
      object_valueOf_123: {__proto__:null, valueOf: () => 123},
      data_descriptor: {__proto__:null, value:123, writable:true, configurable:true, enumerable:true},
      accessor_descriptor: {__proto__:null, get:() => {}, set:() => {}, configurable:true, enumerable:true}
    }, Primitives);
    Object.keys(values).forEach((key) => {
      melf.rprocedures[key] = (origin, data, callback) => {
        callback(null, [
          share1.serialize(values[key]),
          share2.serialize(values[key])
        ]);
      };
    });
    melf.rprocedures.terminate = (origin, data, callback) => {
      callback(null, null);
      melf.terminate((error) => {
        if (error) {
          throw error;
        }
      });
    };
  });
};
