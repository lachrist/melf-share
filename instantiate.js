
const LenientProxy = require("lenient-proxy");

const NAN = 0/0;
const UNDEFINED = void 0;
const NEGATIVE_INFINITY = -1/0;
const POSITIVE_INFINITY = 1/0;
const NEGATIVE_ZERO = -0;

module.exports = (traps, keys, values) => {
  const bind = (key, value) => {
    keys.set(value, key)
    values.set(key, value);
    return value;
  };
  const loop = (data) => {
    if (!data  || data === true || typeof data === "number" || typeof data === "string")
      return data;
    if (Array.isArray(data)) {
      switch (data[0]) {
        case "NaN": return NAN;
        case "Infinity": return POSITIVE_INFINITY;
        case "-Infinity": return NEGATIVE_INFINITY;
        case "-0": return NEGATIVE_ZERO;
        case "undefined": return UNDEFINED;
        case "copy": return data.slice(1).map(loop);
        case "symbol":
          if (data[1] === "wellknown")
            return Symbol[data[2]];
          if (data[1] === "global")
            return Symbol.for(data[2]);
          return values.get(data[1]) || bind(data[1], Symbol(data[2]));
      }
      return values.get(data[1]) || bind(data[1], LenientProxy[data[0]](data[1], traps));
    }
    if (typeof data === "object") {
      const object = {};
      for (let key in data)
        object[key] = loop(data[key]);
      return object;
    }
    throw new Error("Illegal JSON type: "+typeof data);
  };
  return loop;
};