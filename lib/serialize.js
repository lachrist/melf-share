
const wellkown = {__proto__:null};
Reflect.ownKeys(Symbol).forEach((name) => {
  if (typeof Symbol[name] === "symbol") {
    wellkown[Symbol[name]] = name;
  }
});

const has = (object, key) => {
  while (object) {
    if (Reflect.getOwnPropertyDescriptor(object, key))
      return true;
    object = Reflect.getPrototypeOf(object);
  }
  return false;
};

const miss = Symbol("miss");

module.exports = (oids, refs, alias) => {

  let counter = 0;
  
  const oidof = (ref) => {
    let oid = oids.get(ref);
    if (oid)
      return oid;
    oid = alias + "|" + (++counter).toString(36);
    oids.set(ref, oid);
    refs.set(oid, ref);
    return oid;
  };
  
  const owned = (value) => {  
    if (value === null || (typeof value !== "object" && typeof value !== "function"))
      return true;
    const oid = oids.get(value);
    if (oid === undefined)
      return true;
    return oid.split("|")[0] === alias;
  };

  const get = (target, key, receiver) => {
    while (target) {
      if (!owned(target))
        return miss;
      const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
      if (descriptor) {
        if (Reflect.getOwnPropertyDescriptor(descriptor, "value"))
          return descriptor.value;
        if (descriptor.get) {
          if (owned(descriptor.get))
            return Reflect.apply(descriptor.get, receiver, []);
          return miss;
        }
        return undefined
      }
      target = Reflect.getPrototypeOf(target);
    }
    return undefined;
  };

  const loop = (value, hint) => {
    if (hint === "target")
      return "target|" + value.alias + "|" + value.token;
    miss: if (Array.isArray(hint) && value !== null && (typeof value === "object" || typeof value === "function")) {
      const length = get(value, "length", value);
      if (length === miss)
        break miss;
      const array = Array(length);
      for (let index = 0; index < length; index++) {
        array[index] = loop(get(value, index, value), hint[index]);
        if (array[index] === miss) {
          break miss;
        }
      }
      return array;
    }
    miss: if (hint !== null && typeof hint === "object" && value !== null && (typeof value === "object" || typeof value === "function")) {
      const object = {__proto__:null};
      let target = value;
      while (target) {
        if (!owned(target))
          break miss;
        const keys = Object.keys(target);
        for (let index = 0; index < keys.length; index++) {
          object[keys[index]] = loop(get(target, keys[index], target), hint[keys[index]]);
          if (object[keys[index]] === miss) {
            break miss;
          }
        }
        target = Reflect.getPrototypeOf(target);
      }
      return object;
    }
    miss: if ((hint === "number" || hint === "default" || hint === "string") && value !== null && (typeof value === "object" || typeof value === "function")) {
      // https://www.ecma-international.org/ecma-262/9.0/index.html#sec-toprimitive
      const toPrimitive = get(value, Symbol.toPrimitive, value);
      if (toPrimitive === miss || !owned(toPrimitive))
        break miss;
      if (toPrimitive !== undefined) {
        value = Reflect.apply(toPrimitive, value, [hint]);
      } else {
        const method1 = get(value, hint === "string" ? "toString" : "valueOf", value);
        if (method1 === miss || !owned(method1))
          break miss;
        if (typeof method1 === "function") {
          value = Reflect.apply(method1, value, []);
        } else {
          const method2 = get(value, hint === "string" ? "valueOf" : "toString", value);
          if (method2 === miss || !owned(method2))
            break miss;
          if (typeof method2 === "function") {
            value = Reflect.apply(method2, value, []);
          }
        }
      }
    }
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
        return "symbol|" + oidof(value) + "|" + String(value).slice(7, -1);
      case "object":
        if (value === null)
          return null;
        if (Array.isArray(value))
          return "array|" + oidof(value);
        return "object|" + oidof(value);
      case "function":
        try {
          Reflect.construct(Boolean, [], value);
        } catch (error) {
          return "arrow|" + oidof(value);
        }
        return "function|" + oidof(value);
    }
    throw new Error("Unrecognized type: " + typeof value);
  };
  return loop;
};
