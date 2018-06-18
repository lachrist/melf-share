
const ReflectTypes = require("./reflect-types.js");

module.exports = (melf, options, values) => {
  let serialize;
  let instantiate;
  const traps = {};
  Reflect.ownKeys(Reflect).forEach((key) => {
    const name = "melf-share-" + ("namespace" in options ? options.namespace+"-" : "") + key;
    const types = ReflectTypes[key][0];
    const type = ReflectTypes[key][1];
    if (types.length === 1) {
      melf.rprocedures[name] = (origin, data, callback) => {
        try {
          callback(null, serialize(Reflect[key](values.get(melf.alias+"/"+data[0])), type));
        } catch (error) {
          callback(error);
        }
      }
    } else if (types.length === 2) {
      melf.rprocedures[name] = (origin, data, callback) => {
        try {
          callback(null, serialize(Reflect[key](values.get(melf.alias+"/"+data[0]), instantiate(data[1])), type));
        } catch (error) {
          callback(error);
        }
      }
    } else if (types.length === 3) {
      melf.rprocedures[name] = (origin, data, callback) => {
        try {
          callback(null, serialize(Reflect[key](values.get(melf.alias+"/"+data[0]), instantiate(data[1]), instantiate(data[2])), type));
        } catch (error) {
          callback(error);
        }
      }
    } else if (types.length === 4) {
      melf.rprocedures[name] = (origin, data, callback) => {
        try {
          callback(null, serialize(Reflect[key](values.get(melf.alias+"/"+data[0]), instantiate(data[1]), instantiate(data[2]), instantiate(data[3])), type));
        } catch (error) {
          callback(error);
        }
      }
    } else {
      throw new Error("Unrecognized arguments length for Reflect."+key+", got "+types.length);
    }
    if (options.synchronous) {
      traps[key] = function (target) {
        const [alias, token] = target.split("/");
        const array = Array(arguments.length);
        array[0] = token;
        for (let index = 1, length = arguments.length; index < length; index++)
          array[index] = serialize(arguments[index], types[index]);
        return instantiate(melf.rpcall(alias, name, array));
      };
    } else {
      traps[key] = function (target) {
        return new Promise((resolve, reject) => {
          const [alias, token] = target.split("/");
          const array = Array(arguments.length);
          array[0] = token;
          for (let index = 1, length = arguments.length; index < length; index++)
            array[index] = serialize(arguments[index], types[index]);
          melf.rpcall(alias, name, array, (error, data) => {
            if (error)
              return reject(error);
            resolve(instantiate(data));
          });
        });
      }
    }
  });
  traps.resolve = (s, i) => {
    serialize = s;
    instantiate = i;
    delete traps.resolve;
  };
  return traps;
};
