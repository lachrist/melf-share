
const ReflectTypes = require("./reflect-types.js");

module.exports = (melf, synchronous, values) => {
  let serialize;
  let instantiate;
  const traps = {};
  let counter = 0;
  while (("melf-sharing-"+counter+"-apply") in melf.rprocedures)
    counter++;
  Reflect.ownKeys(Reflect).forEach((key) => {
    const name = "melf-sharing-"+counter+"-"+key;
    const types = ReflectTypes[key][0];
    const type = ReflectTypes[key][1];
    if (types.length === 1) {
      melf.rprocedures[name] = (origin, data, callback) => {
        try {
          callback(null, serialize(Reflect[key](values.get(melf.alias+"/"+data[0]))));
        } catch (error) {
          callback(error);
        }
      }
    } else if (types.length === 2) {
      melf.rprocedures[name] = (origin, data, callback) => {
        try {
          callback(null, serialize(Reflect[key](values.get(melf.alias+"/"+data[0]), instantiate(data[1]))));
        } catch (error) {
          callback(error);
        }
      }
    } else if (types.length === 3) {
      melf.rprocedures[name] = (origin, data, callback) => {
        try {
          callback(null, serialize(Reflect[key](values.get(melf.alias+"/"+data[0]), instantiate(data[1]), instantiate(data[2]))));
        } catch (error) {
          callback(error);
        }
      }
    } else if (types.length === 4) {
      melf.rprocedures[name] = (origin, data, callback) => {
        try {
          callback(null, serialize(Reflect[key](values.get(melf.alias+"/"+data[0]), instantiate(data[1]), instantiate(data[2]), instantiate(data[3]))));
        } catch (error) {
          callback(error);
        }
      }
    } else {
      throw new Error("Unrecognized arguments length for Reflect."+key+", got "+types.length);
    }
    if (synchronous) {
      traps[key] = function (target) {
        const array = Array(arguments.length);
        array[0] = target.token;
        for (let index = 1, length = arguments.length; index < length; index++)
          array[index] = serialize(arguments[index], types[index]);
        return instantiate(melf.rpcall(target.alias, name, array));
      };
    } else {
      traps[key] = function (target) {
        return new Promise((resolve, reject) => {
          const array = Array(arguments.length);
          array[0] = target.token;
          for (let index = 1, length = arguments.length; index < length; index++)
            array[index] = serialize(arguments[index], types[index]);
          melf.rpcall(target.alias, name, array, (error, data) => {
            if (error)
              return reject(error);
            resolve(instantiate(data));
          });
        });
      }
    }
  });
  const make = (key, target) => {
    const parts = key.split("/");
    target.alias = parts[0];
    target.token = parts[1];
    return new Proxy(target, traps);
  }
  make.resolve = (s, i) => {
    serialize = s;
    instantiate = i;
    delete make.resolve;
  };
  return make;
};
