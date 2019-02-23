
const VirtualProxy = require("virtual-proxy");
const ReflectTyping = require("./reflect-typing.js");

module.exports = (melf, serialize, instantiate, namespace) => {
  const handler = {__proto__:null};
  Reflect.ownKeys(ReflectTyping).forEach((key) => {
    const name = namespace ? "melf-share-" + namespace + "-" + key : "melf-share-" + key;
    const types = ReflectTyping[key][0];
    const type = ReflectTyping[key][1];
    handler[key] = (...data) => {
      const alias = data[0].alias;
      for (let index = 0, length = data.length; index < length; index++)
        data[index] = serialize(data[index], types[index]);
      return instantiate(melf.rpcall(alias, name, data));
    };
    melf.rprocedures[name] = (origin, data, callback) => {
      try {
        callback(null, serialize(Reflect[key](...data.map(instantiate)), type));
      } catch (error) {
        callback(error);
      }
    };
  });
  return {
    __proto__: null,
    object: (alias, token) => VirtualProxy({}, {__proto__:null, alias, token}, handler),
    array: (alias, token) => VirtualProxy([], {__proto__:null, alias, token}, handler),
    arrow: (alias, token) => VirtualProxy(() => {}, {__proto__:null, alias, token}, handler),
    // We use a strict function as shadow target so that the caller and arguments fileds are not defined
    function: (alias, token) => VirtualProxy(function () { "use strict" }, {__proto__:null, alias, token}, handler),
  };
};
