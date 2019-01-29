
const ReflectTypes = require("./reflect-types.js");
const VirtualProxy = require("virtual-proxy");

module.exports = (melf, serialize, instantiate, options) => {
  const handler = {__proto__:null};
  Reflect.ownKeys(Reflect).forEach((key) => {
    const name = "melf-share-" + ("namespace" in options ? options.namespace+"-" : "") + key;
    const types = ReflectTypes[key][0];
    const length = types.length;
    const type = ReflectTypes[key][1];
    melf.rprocedures[name] = (origin, data, callback) => {
      try {
        for (let index = 0, length = data.length; index < length; index++)
          data[index] = instantiate(data[index]);
        callback(null, serialize(Reflect[key](...data), type));
      } catch (error) {
        callback(error);
      }
    };
    if (options.synchronous) {
      handler[key] = (...data) => {
        const alias = data[0].alias;
        for (let index = 0, length = data.length; index < length; index++)
          data[index] = serialize(data[index], types[index]);
        return instantiate(melf.rpcall(alias, name, data));
      };
    } else {
      handler[key] = function (...data) {
        const alias = this.alias;
        data.unshift(this);
        for (let index = 0, length = data.length; index < length; index++)
          data[index] = serialize(data[index], types[index]);
        return new Promise((reject, resolve) => {
          melf.rpcall(alias, name, data, (error, data) => {
            if (error)
              return reject(error);
            resolve(instantiate(data));
          });
        });
      };
    }
  });
  if (options.synchronous) {
    return {
      __proto__: null,
      object: (alias, token) => VirtualProxy({}, {__proto__:null, alias, token}, handler),
      array: (alias, token) => VirtualProxy([], {__proto__:null, alias, token}, handler),
      arrow: (alias, token) => VirtualProxy(() => {}, {__proto__:null, alias, token}, handler),
      function: (alias, token) => VirtualProxy(function () {}, {__proto__:null, alias, token}, handler),
      "strict-function": (alias, token) => VirtualProxy(function () { "use strict"; }, {__proto__:null, alias, token}, handler),
    };
  }
  const helper = (alias, token, target) => {
    Reflect.setPrototypeOf(target, handler);
    target.alias = alias;
    target.token = token;
    return target;
  } 
  return {
    __proto__: null,
    object: (alias, token) => {__proto__:handler, alias, token},
    array: (alias, token) => helper(alias, token, []),
    arrow: (alias, token) => helper(alias, token, () => {}),
    function: (alias, token) => helper(alias, token, function () {}),
    "strict-function": (alias, token) => helper(alias, token, function () { "use strict";})
  };
};
