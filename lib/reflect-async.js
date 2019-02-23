
const ReflectSync = require("./reflect-sync.js");

module.exports = (handlers, remotes) => {

  const reflect = {};

  // https://tc39.github.io/ecma262/#sec-abstract-equality-comparison
  const equalityComparison = async (value1, value2) => {
    if (value1 !== null && (typeof value1 === "object" || typeof value1 === "function")) {
      if (value2 !== null && (typeof value2 === "object" || typeof value2 === "function"))
        return value1 === value2;
      return await toPrimitive(value1) == value2;
    }
    if (value2 !== null && (typeof value2 === "object" || typeof value2 === "function"))
      return value1 == await toPrimitive(value2);
    return value1 == value2;
  };

  // https://www.ecma-international.org/ecma-262/9.0/index.html#sec-toprimitive
  const toPrimitive = async (value, hint) => {
    if (value === null || (typeof value !== "object" && typeof value !== "function"))
      return value;
    const toPrimitive = await reflect.get(value, Symbol.toPrimitive);
    if (toPrimitive !== undefined) {
      value = await reflect.apply(toPrimitive, value, [hint]);
    } else {
      const method1 = await reflect.get(value, hint === "string" ? "toString" : "valueOf");
      if (typeof method1 === "function") {
        value = await reflect.apply(method1, value, []);
      } else {
        const method2 = await reflect.get(value, hint === "string" ? "valueOf" : "toString");
        if (method2 === "function") {
          value = await reflect.apply(method2, value, []);
        }
      }
    }
    if (value !== null && (typeof value === "object" || typeof value === "function"))
      throw new TypeError("Cannot convert object to primitive value");
    return value;
  };

  // https://www.ecma-international.org/ecma-262/9.0/index.html#sec-hasproperty
  const hasProperty = async (value, key) => {
    while (value) {
      if (await reflect.getOwnPropertyDescriptor(value, key))
        return true;
      value = await reflect.getPrototypeOf(value);
    }
    return false;
  };
  
  // https://www.ecma-international.org/ecma-262/9.0/index.html#sec-topropertydescriptor
  const toPropertyDescriptor = async (value) => {
    const descriptor = {__proto__:null};
    const keys = ["value", "writable", "get", "set", "enumerable", "configurable"];
    for (let index = 0; index < keys.length; index++) {
      if (await hasProperty(value, keys[index])) {
        descriptor[keys[index]] = await reflect.get(value, keys[index]);
      }
    }
    return descriptor;
  };
  
  reflect.getPrototypeOf = async (target) => {
    if (remotes.has(target))
      return handlers.getPrototypeOf(target);
    return Reflect.getPrototypeOf(target);
  };

  reflect.setPrototypeOf = async (target, prototype) => {
    if (remotes.has(target))
      return handlers.setPrototypeOf(target, prototype);
    return Reflect.setPrototypeOf(target, prototype);
  };

  reflect.isExtensible = async (target) => {
    if (remotes.has(target))
      return handlers.isExtensible(target);
    return Reflect.isExtensible(target);
  };

  reflect.preventExtensions = async (target) => {
    if (remotes.has(target))
      return handlers.preventExtensions(target);
    return Reflect.preventExtensions(target);
  };

  reflect.apply = async (target, value, values) => {
    if (remotes.has(target))
      return handlers.apply(target, value, values);    
    const array = [];
    const length = await reflect.get(values, "length");
    for (let index = 0; index < length; index++)
      array[index] = await reflect.get(values, index);
    return Reflect.apply(target, value, array);
  };
  
  reflect.construct = async (target, values, ...rest) => {
    if (remotes.has(target))
      return handlers.construct(target, values, ...rest);
    const array = [];
    const length = await reflect.get(values, "length");
    for (let index = 0; index < length; index++)
      array[index] = await reflect.get(values, index);
    if (rest.length) {
      Reflect.construct(Boolean, [], rest[0]);
      const prototype = await reflect.get(rest[0], "prototype");
      rest[0] = function () {};
      rest[0].prototype = prototype;
    }
    return Reflect.construct(target, array, ...rest);
  };

  reflect.getOwnPropertyDescriptor = async (target, key) => {
    if (remotes.has(target))
      return handlers.getOwnPropertyDescriptor(target, key);
    if (remotes.has(key))
      key = await toPrimitive(key, "string");
    return Reflect.getOwnPropertyDescriptor(target, key);
  };

  reflect.defineProperty = async (target, key, descriptor) => {
    if (remotes.has(target))
      return handlers.defineProperty(target, key, descriptor);
    if (remotes.has(key))
      key = await toPrimitive(key, "string");
    descriptor = await toPropertyDescriptor(descriptor);
    return Reflect.defineProperty(target, key, descriptor);
  };

  reflect.deleteProperty = async (target, key) => {
    if (remotes.has(target))
      return handlers.deleteProperty(target, key);
    if (remotes.has(key))
      key = await toPrimitive(key, "string");
    return Reflect.deleteProperty(target, key);
  };

  reflect.has = async (target, key) => {
    if (await reflect.getOwnPropertyDescriptor(target, key))
      return true;
    const prototype = await reflect.getPrototypeOf(target);
    if (prototype === null)
      return false;
    return await reflect.has(prototype, key);
  };

  reflect.get = async (target, key, ...rest) => {
    const descriptor = await reflect.getOwnPropertyDescriptor(target, key);
    if (descriptor) {
      if (Reflect.getOwnPropertyDescriptor(descriptor, "value"))
        return descriptor.value;
      if (descriptor.get)
        return await reflect.apply(descriptor.get, rest.length ? rest[0] : target, []);
      return undefined;
    }
    const prototype = await reflect.getPrototypeOf(target);
    if (prototype === null)
      return undefined;
    return await reflect.get(prototype, key, value, ...rest);
  };
  
  reflect.set = async (target, key, value, ...rest) => {
    let descriptor = await reflect.getOwnPropertyDescriptor(target, key);
    if (descriptor) {
      if (Reflect.getOwnPropertyDescriptor(descriptor, "value")) {
        if (!descriptor.writable) {
          return false;
        }
      } else {
        if (descriptor.set) {
          await reflect.apply(descriptor.set, rest.length ? rest[0] : target, []);
          return true;
        }
        return false;
      }
    } else {
      const prototype = await reflect.getPrototypeOf(target);
      if (prototype !== null) {
        return await reflect.set(prototype, key, value, ...rest);
      }
    }
    descriptor = (await reflect.getOwnPropertyDescriptor(rest.length ? rest[0] : target) || {
      value: undefined,
      writable: true,
      enumerable: true,
      configurable: true
    });
    if (!Reflect.getOwnPropertyDescriptor(descriptor, "value"))
      return false;
    if (!descriptor.writable)
      return false;
    descriptor.value = value;
    await reflect.defineProperty(rest.length ? rest[0] : target, key, descriptor);
    return true;
  };
  
  reflect.unary = async (operator, argument) => {
    if (operator === "typeof")
      return typeof argument;
    if (operator === "void")
      return undefined;
    if (operator === "delete")
      return true;
    return ReflectSync.unary(operator, await toPrimitive(argument));
  };
  
  reflect.binary = async (operator, left, right) => {
    if (operator === "in")
      return reflect.has(right, left);
    if (operator === "===")
      return left === right;
    if (operator === "!==")
      return left !== right;
    if (operator === "==")
      return equalityComparison(left, right);
    if (operator === "!=")
      return !equalityComparison(left, right);
    if (operator === "instanceof") {
      Reflect.construct(Boolean, [], right);
      if (left === null || (typeof left !== "object" && typeof left !== "function"))
        return false;
      left = await reflect.getPrototypeOf(left);
      const prototype = await reflect.get(right, "prototype");
      while (left) {
        if (left === prototype)
          return true;
        left = await reflect.getPrototypeOf(left);
      }
      return false;
    }
    return ReflectSync.binary(operator, await toPrimitive(left), await toPrimitive(right));
  };
  
  return reflect;

};
