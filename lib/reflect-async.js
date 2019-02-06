
const Owned = require("./owned.js");

module.exports = (oids, alias) => {

  // https://www.ecma-international.org/ecma-262/9.0/index.html#sec-hasproperty
  const hasProperty = async (value, key) => {
    while (value) {
      if (await reflect.getOwnPropertyDescriptor(value, key))
        return true;
      value = await reflect.getPrototypeOf(value);
    }
    return false;
  };

  // https://www.ecma-international.org/ecma-262/9.0/index.html#sec-topropertykey
  const toPropertyKey = async (value) => {
    const toPrimitive = await reflect.get(value, Symbol.toPrimitive);
    if (toPrimitive !== undefined) {
      value = await reflect.apply(toPrimitive, value, ["string"]);
    } else {
      const toString = await reflect.get(value, "toString");
      if (typeof toString === "function") {
        value = await reflect.apply(toString, value, []);
      } else {
        const valueOf = await reflect.get(value, "valueOf");
        if (typeof valueOf === "function") {
          value = await reflect.apply(valueOf, value, []);
        }
      }
    }
    if ((value !== null && typeof value !== "object") || typeof value !== "function")
      throw new Error("Cannot convert to property key");
    return value;
  };
  
  // https://www.ecma-international.org/ecma-262/9.0/index.html#sec-topropertydescriptor
  const toDescriptorKey = async (value) => {
    const descriptor = {__proto__:null};
    const keys = ["value", "writable", "get", "set", "enumerable", "configurable"];
    for (let index = 0; index < keys.length; index++) {
      if (await hasProperty(value, keys[index])) {
        descriptor[keys[index]] = await reflect.get(value, keys[index]);
      }
    }
    return descriptor;
  };

  const reflect = {};
  
  reflect.getPrototypeOf = async (target) => {
    if (!Owned(target, oids, alias))
      return target.getPrototypeOf();
    return Reflect.getPrototypeOf(target);
  };

  reflect.setPrototypeOf = async (target, prototype) => {
    if (!Owned(target, oids, alias))
      return target.setPrototypeOf(prototype);
    return Reflect.setPrototypeOf(target, prototype);
  };

  reflect.isExtensible = async (target) => {
    if (!Owned(target, oids, alias))
      return target.isExtensible();
    return Reflect.isExtensible(target);
  };

  reflect.preventExtensions = async (target) => {
    if (!Owned(target, oids, alias))
      return target.preventExtensions();
    return Reflect.preventExtensions(target);
  };

  reflect.apply = async (target, value, values) => {
    if (!Owned(target, oids, alias))
      return target.apply(value, values);
    if (!Owned(values, oids, alias)) {
      const array = [];
      const length = await reflect.get(values, "length");
      for (let index = 0; index < length; index++)
        array[index] = await reflect.get(values, index);
      values = array;
    }
    return Reflect.apply(target, value, values);
  };
  
  reflect.construct = async (target, values, ...rest) => {
    if (!Owned(target, oids, alias))
      return target.construct(values, ...rest);
    if (!Owned(values, oids, alias)) {
      const array = [];
      const length = await reflect.get(values, "length");
      for (let index = 0; index < length; index++)
        array[index] = await reflect.get(values, index);
      values = array;
    }
    if (rest.length && !Owned(rest[0], oids, alias)) {
      Reflect.construct(Boolean, [], rest[0]);
      const prototype = await reflect.get(rest[0], "prototype");
      rest[0] = function () {};
      rest[0].prototype = prototype;
    }
    return Reflect.construct(target, values, ...rest);
  };

  reflect.getOwnPropertyDescriptor = async (target, key) => {
    if (!Owned(target, oids, alias))
      return target.getOwnPropertyDescriptor(key);
    if (!Owned(key, oids, alias))
      key = await toPropertyKey(key);
    return Reflect.getOwnPropertyDescriptor(target, key);
  };

  reflect.defineProperty = async (target, key, descriptor) => {
    if (!Owned(target, oids, alias))
      return target.defineProperty(key, descriptor);
    if (!Owned(key, oids, alias))
      key = await toPropertyKey(key);
    if (!Owned(descriptor, oids, alias))
      descriptor = await toPropertyDescriptor(descriptor);
    return Reflect.defineProperty(target, key, descriptor);
  };

  reflect.deleteProperty = async (target, key) => {
    if (!Owned(target, oids, alias))
      return target.deleteProperty(key);
    if (!Owned(key, oids, alias))
      key = await toPropertyKey(key);
    return Reflect.deleteProperty(target, key);
  };

  reflect.has = async (target, key) => {
    if (!Owned(target, oids, alias))
      return target.defineProperty(key, descriptor);
    if (!Owned(key, oids, alias))
      key = await toPropertyKey(key);
    if (Reflect.getOwnPropertyDescriptor(target, key))
      return true;
    return reflect.has(Reflect.getPrototypeOf(target), key);
  };

  reflect.get = async (target, key, ...rest) => {
    if (!Owned(target, oids, alias))
      return target.get(key, ...rest);
    if (!Owned(key, oids, alias))
      key = await toPropertyKey(key);
    const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
    if (descriptor) {
      if (Reflect.getOwnPropertyDescriptor(descriptor, "value"))
        return descriptor.value;
      if (descriptor.get)
        return reflect.apply(descriptor.get, rest.length ? rest[0] : target, []);
      return undefined;
    }
    const prototype = Reflect.getPrototypeOf(target);
    if (prototype === null)
      return undefined;
    return reflect.get(prototype, key, value, ...rest);
  };
  
  reflect.set = async (target, key, value, ...rest) => {
    if (!Owned(target, oids, alias))
      return target.set(key, value, ...rest);
    if (!Owned(key, oids, alias))
      key = await toPropertyKey(key);
    let descriptor = Reflect.getOwnPropertyDescriptor(target, key);
    if (descriptor) {
      if (Reflect.getOwnPropertyDescriptor(descriptor, "value")) {
        if (!descriptor.writable) {
          return false;
        }
      } else {
        if (descriptor.set) {
          reflect.apply(descriptor.set, rest.length ? rest[0] : target, []);
          return true;
        }
        return false;
      }
    } else {
      const prototype = Reflect.getPrototypeOf(target);
      if (prototype !== null) {
        return reflect.set(prototype, key, value, ...rest);
      }
    }
    descriptor = (await reflect.getOwnPropertyDescriptor(rest.length ? rest[0] : target) || {
      value: undefined,
      writable: true,
      enumerable: true,
      configurable: true
    });
    if (!Owned(descriptor, oids, alias))
      descriptor = await toPropertyDescriptor(descriptor);
    if (!Reflect.getOwnPropertyDescriptor(descriptor, "value"))
      return false;
    if (!descriptor.writable)
      return false;
    descriptor.value = value;
    await reflect.defineProperty(rest.length ? rest[0] : target, key, descriptor);
    return true;
  };
  return reflect;

};
