
const VirtualProxy = require("virtual-proxy");

const typess = {__proto__:null};
typess.getPrototypeOf = [["target"], null];
typess.setPrototypeOf = [["target", null], null];
typess.isExtensible = [["target"], null];
typess.preventExtensions = [["target"], null];
typess.getOwnPropertyDescriptor = [["target", "string"], {}];
typess.defineProperty = [["target", "string", {}], null];
typess.has = [["target", "string"], null];
typess.get = [["target", "string", null], null];
typess.set = [["target", "string", null, null], null];
typess.deleteProperty = [["target", "string"], null];
typess.ownKeys = [["target"], []];
typess.apply = [["target", null, []], null];
typess.construct = [["target", [], null], null];

module.exports = (melf, serialize, instantiate, reflect, namespace) => {
  const handler = {__proto__:null};
  Reflect.ownKeys(typess).forEach((key) => {
    const name = namespace ? "melf-share-" + namespace + "-" + key : "melf-share-" + key;
    const types = typess[key][0];
    const length = types.length;
    const type = typess[key][1];
    if (reflect === Reflect) {
      handler[key] = (...data) => {
        const alias = data[0].alias;
        for (let index = 0, length = data.length; index < length; index++)
          data[index] = serialize(data[index], types[index]);
        return instantiate(melf.rpcall(alias, name, data));
      };
      melf.rprocedures[name] = (origin, data, callback) => {
        try {
          callback(null, serialize(reflect[key](...data.map(instantiate)), type));
        } catch (error) {
          callback(error);
        }
      };
    } else {
      handler[key] = function (...data) {
        const alias = this.alias;
        data.unshift(this);
        for (let index = 0, length = data.length; index < length; index++)
          data[index] = serialize(data[index], types[index]);
        return new Promise((resolve, reject) => {
          melf.rpcall(alias, name, data, (error, data) => {
            if (error)
              return reject(error);
            resolve(instantiate(data));
          });
        });
      };
      melf.rprocedures[name] = (origin, data, callback) => {
        reflect[key](...data.map(instantiate)).then((result) => {
          callback(null, serialize(result, type));
        }, callback);
      };
    }
  });
  if (reflect === Reflect) {
    return {
      __proto__: null,
      object: (alias, token) => VirtualProxy({}, {__proto__:null, alias, token}, handler),
      array: (alias, token) => VirtualProxy([], {__proto__:null, alias, token}, handler),
      arrow: (alias, token) => VirtualProxy(() => {}, {__proto__:null, alias, token}, handler),
      // We use a strict function as shadow target so that the caller and arguments fileds are not defined
      function: (alias, token) => VirtualProxy(function () { "use strict" }, {__proto__:null, alias, token}, handler),
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
    object: (alias, token) => ({__proto__:handler, alias, token}),
    array: (alias, token) => helper(alias, token, []),
    arrow: (alias, token) => helper(alias, token, () => {}),
    function: (alias, token) => helper(alias, token, function () {})
  };
};
