
const UNDEFINED = void 0;
const NEGATIVE_INFINITY = -1/0;
const POSITIVE_INFINITY = 1/0;

module.exports = (alias, keys, values) => {
  let counter = 0;
  const link = (value) => {
    const key = alias + "/" + (++counter).toString(36);
    keys.set(value, key);
    values.set(key, value);
    return key;
  };
  const loop = (value, hint) => {
    if (value && Array.isArray(hint)) {
      const array = Array(value.length+1);
      array[0] = null;
      for (let index = 0, length = value.length; index < length; index++)
        array[index+1] = loop(value[index], hint[index]);
      return array;
    }
    if (value && hint && typeof hint === "object") {
      const object = {};
      for (let key in value)
        object[key] = loop(value[key], hint[key]);
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
          return ["symbol", "well-knwon", SymbolNames[value]];
        if (Symbol.keyFor(value) !== UNDEFINED)
          return ["symbol", "shared", Symbol.keyFor(value)];
        return ["symbol", keys.get(value) || link(value), String(value).slice(7, -1)];
      case "object":
        if (!value)
          return null;
        if (Array.isArray(value))
          return ["array", keys.get(value) || link(value)];
        return ["object", keys.get(value) || link(value)];
      case "function": return ["function", keys.get(value) || link(value)];
    }
    throw new Error("Unrecognized type: " + typeof value);
  };
  return loop;
};
