const Default = require("./default.js");

const UNDEFINED = void 0;
const NEGATIVE_INFINITY = -1/0;
const POSITIVE_INFINITY = 1/0;

module.exports = (alias, keyof, bind) => {
  let counter = 0;
  const link = (value) => {
    const key = alias + "/" + (++counter).toString(36);
    keyof.set(value, key);
    valueof.set(key, value);
    return key;
  };
  const loop = (value, hint) => {
    if (Array.isArray(hint)) {
      const array = Array(value.length);
      for (let index = 0, length = value.length; index < length; index++)
        array[index] = loop(value[index], index < hint.length ? hint[index] || hint[hint.length-1]);
      return [null, array];
    }
    if (hint && typeof hint === "object") {
      const object = {};
      for (let key in value)
        object[key] = loop(value[key], key in hint ? hint[key] : hint[Default]);
      return object;
    }
    switch (typeof value) {
      case "undefined": return ["undefined"];
      case "boolean": return value;
      case "number":
        if (value !== value)
          return ["NaN"];
        if (value === NEGATIVE_INFINITY)
          return ["-Infinity"];
        if (value === POSITIVE_INFINITY)
          return ["Infinity"];
        if (!value && 1/value === NEGATIVE_INFINITY)
          return ["-0"];
        return value;
      case "string": return value;
      case "symbol":
        if (value in SymbolNames)
          return ["symbol", null, SymbolNames[value]]
        return ["symbol", keyof.get(value) || link(value), String(value).slice(7, -1)];
      case "object":
        if (!value)
          return null;
        if (Array.isArray(value))
          return ["array", keyof.get(value) || link(value)];
        return ["object", keyof.get(value) || link(value)];
      case "function": return ["function", keyof.get(value) || link(value)];
    }
    throw new Error("Unrecognized type: " + typeof value);
  };
  return loop;
};
