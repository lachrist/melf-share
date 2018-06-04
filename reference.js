
const ReflectTypes = require("./reflect-types.js");

module.exports = (melf, options) => {
  let instantiate;
  let serialize;
  let counter = 0;
  const traps = {};
  const refs = {};
  Reflect.ownKeys(Reflect).forEach((key) => {
    const name = "kalah-"+key;
    const itype = ReflectTypes[key][0];
    const otype = ReflectTypes[key][1];
    melf.rprocedures[name] = (origin, data, callback) => {
      try {
        const target = refs[melf.alias+"/"+data.shift()];
        const arguments = imp(data, itype);
        arguments.unshift(target);
        callback(null, exp(Reflect[key].apply(null, arguments), otype));
      } catch (err) {
        callback(err);
      }
    };
    if (options.sync) {
      traps[key] = (target, ...arguments) => {
        const data = exp(arguments, itype);
        data.unshift(target.token);
        return imp(melf.rcall(target.alias, name, data), otype);
      };
    } else {
      traps[key] = (target, ...arguments) => {
        return new Promise((resolve, reject) => {
          const data = exp(arguments, itype);
          data.unshift(target.token);
          melf.rcall(target.alias, name, data, (error, data) => {
            if (error)
              return reject(error);
            resolve(imp(data, otype));
          });
        });
      }
    }
  });
  // TODO suport symbols
  return {
    resolve_instantiate: (closure) => instantiate = closure,
    resolve_serialize: (closure) => serialize = closure,
    ownerof: (ref) => {
      for (let key in refs)
        if (refs[key] === ref)
          return key.split("/")[0];
      return melf.alias;
    },
    instantiate: (key) => {
      if (key in refs)
        return refs[key];
      const parts = key.split("/");
      // if (parts[1][0] === "s")
      //   return refs[key] = Symbol(key);
      const target = parts[1][0] === "f" ? (() => {}) : (parts[1][0] === "a" ? [] : {});
      target.alias = parts[0];
      target.token = parts[1];
      return refs[key] = new Proxy(target, traps);
    },
    serialize: (ref) => {
      for (let key in refs)
        if (refs[key] === ref)
          return key;
      const key = melf.alias+"/"+(Array.isArray(ref) ? "a" : (typeof ref)[0])+(++counter).toString(36);
      refs[key] = ref;
      return key;
    }
  };
};
