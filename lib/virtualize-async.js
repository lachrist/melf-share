
const ReflectTyping = require("./reflect-typing.js");

module.exports = (melf, serialize, instantiate, reflect, namespace) => {
  const prototype = {__proto__:null};
  Reflect.ownKeys(ReflectTyping).forEach((key) => {
    const name = namespace ? "melf-share-" + namespace + "-" + key : "melf-share-" + key;
    const types = ReflectTyping[key][0];
    const type = ReflectTyping[key][1];
    prototype[key] = function (...data) {
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
  });
  const helper = (alias, token, target) => {
    Reflect.setPrototypeOf(target, prototype);
    target.alias = alias;
    target.token = token;
    return target;
  }
  return {
    __proto__: null,
    object: (alias, token) => ({__proto__:prototype, alias, token}),
    array: (alias, token) => helper(alias, token, []),
    arrow: (alias, token) => helper(alias, token, () => {}),
    function: (alias, token) => helper(alias, token, function () {})
  };
};
