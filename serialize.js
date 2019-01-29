
const wellkown = {__proto__:null};
Reflect.ownKeys(Symbol).forEach((name) => {
  if (typeof Symbol[name] === "symbol") {
    wellkown[Symbol[name]] = name;
  }
});

module.exports = (keys, values, alias) => {
  let counter = 0;
  const keyof = (value) => {
    let key = keys.get(value);
    if (key)
      return key;
    key = alias + "|" + (++counter).toString(36);
    keys.set(value, key);
    values.set(key, value);
    return key;
  };
  const loop = (value, hint) => {
    if (value && Array.isArray(hint)) {
      let length = value.length
      const array = Array(length);
      for (let index = 0; index < length; index++)
        array[index] = loop(value[index], hint[index]);
      return array;
    }
    if (value && hint && typeof hint === "object") {
      const object = {__proto__:null};
      for (let key in value)
        object[key] = loop(value[key], hint[key]);
      return object;
    }
    if (hint === "target")
      return "target|" + value.alias + "|" + value.token;
    switch (typeof value) {
      case "undefined": return "undefined";
      case "boolean": return value;
      case "number":
        if (value !== value)
          return "NaN";
        if (value === -Infinity)
          return "-Infinity";
        if (value === Infinity)
          return "Infinity";
        if (value === 0 && 1/value === -Infinity)
          return "-0";
        return value;
      case "string": return "string|" + value;
      case "symbol":
        if (value in wellkown)
          return "symbol-wellknown|" + wellkown[value];
        if (Symbol.keyFor(value) !== undefined)
          return "symbol-global|" + Symbol.keyFor(value);
        return "symbol|" + keyof(value) + "|" + String(value).slice(7, -1);
      case "object":
        if (value === null)
          return null;
        if (Array.isArray(value))
          return "array|" + keyof(value);
        return "object|" + keyof(value);
      case "function":
        if (!Reflect.getOwnPropertyDescriptor(value, "prototype"))
          return "arrow|" + keyof(value);
        if (Reflect.getOwnPropertyDescriptor(value, "arguments"))
          return "function|" + keyof(value);
        return "strict-function|" + keyof(value);
    }
    throw new Error("Unrecognized type: " + typeof value);
  };
  return loop;
};
