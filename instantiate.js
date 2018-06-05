
const NAN = 0/0;
const UNDEFINED = void 0;
const NEGATIVE_INFINITY = -1/0;
const POSITIVE_INFINITY = 1/0;
const NEGATIVE_ZERO = -0;

module.exports = (traps, keyof, valueof) => {
  const bind = (key, value) => {
    keyof.set(key, value)
    valueof.set(value, key);
    return value;
  };
  const make_proxy = (key, target) => {
    const parts = key.split("/");
    target.alias = parts[0];
    target.token = parts[1];
    return new Proxy(target, traps);
  }
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
        case "array": return valueof.get(value[1]) || bind(value[1], make_proxy(value[1], []));
        case "function": return valueof.get(value[1]) || bind(value[1], make_proxy(value[1], function () {}));
        case "object": return valueof.get(value[1]) || bind(value[1], make_proxy(value[1], {}));
        case "symbol": return value[1] ? (valueof.get(value[1]) || register(value[1], Symbol(value[2]))) : Symbol[value[2]];
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