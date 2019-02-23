
const ReflectTyping = require("./reflect-typing.js");
const ReflectAsync = require("./reflect-async.js");

module.exports = (melf, serialize, instantiate, namespace) => {
  const handlers = {__proto__:null};
  const prototype = {__proto__:null};
  const remotes = new WeakSet();
  const reflect = ReflectAsync(handlers, remotes);
  Reflect.ownKeys(ReflectTyping).forEach((key) => {
    const name = "melf-share-" + (namespace ? namespace + "-" : "") + key;
    const types = ReflectTyping[key][0];
    const type = ReflectTyping[key][1];
    handlers[key] = (...data) => {
      const alias = data[0].alias;
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
  Reflect.ownKeys(Reflect).forEach((key) => {
    const handler = handlers[key];
    prototype[key] = function (...data) {
      return handler(this, ...data);
    }
  });
  const helper = (alias, token, target) => {
    remotes.add(target);
    Reflect.setPrototypeOf(target, prototype);
    target.alias = alias;
    target.token = token;
    return target;
  }
  return {
    __proto__: null,
    reflect: reflect,
    object: (alias, token) => helper(alias, token, {}),
    array: (alias, token) => helper(alias, token, []),
    arrow: (alias, token) => helper(alias, token, () => {}),
    function: (alias, token) => helper(alias, token, function () {})
  };
};
