
const ReflectTypes = require("./reflect-types.js");

module.exports = (melf, synchronous) => {
  const traps = {};
  Reflect.ownKeys(Reflect).forEach((key) => {
    const name = "melf-sharing-"+key;
    const types = ReflectTypes[key][0];
    const type = ReflectTypes[key][1];
    if (types.length === 0) {
      melf.rprocedures[name] = (origin, data, callback) => {
        try {
          callback(null, serialize(Reflect[key](objects[melf.alias+"/"+data[0]])))
        } catch (error) {
          callback(error);
        }
      }
    } else if (types.length === 1) {
      melf.rprocedures[name] = (origin, data, callback) => {
        try {
          callback(null, serialize(Reflect[key](objects[melf.alias+"/"+data[0]], instantiate(data[1]))));
        } catch (error) {
          callback(error);
        }
      }
    } else if (types.length === 2) {
      melf.rprocedures[name] = (origin, data, callback) => {
        try {
          callback(null, serialize(Reflect[key](objects[melf.alias+"/"+data[0]], instantiate(data[1]), instantiate(data[2]))));
        } catch (error) {
          callback(error);
        }
      }
    } else if (type.length === 3) {
      melf.rprocedures[name] = (origin, data, callback) => {
        try {
          callback(null, serialize(Reflect[key](objects[melf.alias+"/"+data[0]], instantiate(data[1]), instantiate(data[2]), instantiate(data[3]))));
        } catch (error) {
          callback(error);
        }
      }
    } else {
      throw new Error("Unrecognized arguments length for Reflect." + key + ", got " + types.length);
    }
    if (options.sync) {
      traps[key] = function (target) {
        const array = Array(arguments.length-1);
        array[0] = target.token;
        for (let index = 1, length = arguments.length; index < length; index++)
          array[index] = serialize(arguments[index], types[index]);
        return instantiate(melf.rcall(target.alias, name, array));
      };
    } else {
      traps[key] = function (target) {
        return new Promise((resolve, reject) => {
          const array = Array(arguments.length-1);
          array[0] = target.token;
          for (let index = 1, length = arguments.length; index < length; index++)
            array[index] = serialize(arguments[index], types[index]);
          melf.rcall(target.alias, name, array, (error, data) => {
            if (error)
              return reject(error);
            resolve(instantiate(data));
          });
        });
      }
    }
  });
  return traps;
};
