
const NAN = 0/0;
const UNDEFINED = void 0;
const NEGATIVE_INFINITY = -1/0;
const POSITIVE_INFINITY = 1/0;
const NEGATIVE_ZERO = -0;

module.exports = (far, keys, values) => {
  const bind = (key, value) => {
    keys.set(key, value)
    values.set(value, key);
    return value;
  };
  const loop = (value) => {
    const type = typeof value;
    if (value === null || type === "boolean" || type === "number" || typeof value == "string")
      return value;
    if (Array.isArray(value)) {
      switch (value[0]) {
        case "NaN": return NAN;
        case "Infinity": return POSITIVE_INFINITY;
        case "-Infinity": return NEGATIVE_INFINITY;
        case "-0": return NEGATIVE_ZERO;
        case "undefined": return UNDEFINED;
        case "array": return values.get(value[1]) || bind(value[1], far(value[1], []));
        case "function": return values.get(value[1]) || bind(value[1], far(value[1], function () {}));
        case "object": return values.get(value[1]) || bind(value[1], far(value[1], {}));
        case "symbol":
          if (value[1] === "well-known")
            return Symbol[value[2]];
          if (value[1] === "shared")
            return Symbol.for(value[value2]);
          return valueof.get(value[1]) || register(value[1], Symbol(value[2]));
        default:
          const array = Array(value.length-1);
          for (let index = 1, length = value.length; index<length; index++)
            array[index-1] = loop(value[index]);
          return array;
      }
    }
    if (type === "object") {
      const object = {};
      for (let key in value)
        object[key] = loop(value[key]);
      return object;
    }
  };
  return loop;
};