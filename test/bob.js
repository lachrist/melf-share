
const Melf = require("melf");
const MelfShare = require("../lib/main.js");
const Primitives = require("./primitives.js");

const isconstructor = (value) => {
  try {
    Reflect.construct(Boolean, [], value);
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = (address) => {
  const main = async () => {
    let counter = 0;
    const assert = (check) => {
      if (!check)
        throw new Error("Assertion failure");
      counter++;
    };
    const melf = Melf(address, "bob");
    share1 = MelfShare(melf, {synchronous:true, namespace:"sync"});
    share2 = MelfShare(melf, {synchronous:false, namespace:"async"});
    const get = (name) => {
      const array = melf.rpcall("alice", name);
      return [
        share1.instantiate(array[0]),
        share2.instantiate(array[1])
      ];
    };
    // Non Symbolic Primitives
    Object.keys(Primitives).forEach((key) => {
      const [primitive1, primitive2] = get(key);
      assert(Object.is(Primitives[key], primitive1));
      assert(Object.is(Primitives[key], primitive2));
    });
    // Global Symbol
    const [symbol_global_foo1, symbol_global_foo2] = get("symbol_global_foo");
    assert(typeof symbol_global_foo1 === "symbol");
    assert(typeof symbol_global_foo2 === "symbol");
    assert(String(symbol_global_foo1 === "Symbol(foo)"));
    assert(String(symbol_global_foo2 === "Symbol(foo)"));
    assert(symbol_global_foo1 === Symbol.for("foo"));
    assert(symbol_global_foo2 === Symbol.for("foo"));
    // Wellknown Symbol
    const [symbol_wellknown_iterator1, symbol_wellknown_iterator2] = get("symbol_wellknown_iterator");
    assert(typeof symbol_wellknown_iterator1 === "symbol");
    assert(typeof symbol_wellknown_iterator2 === "symbol");
    assert(String(symbol_wellknown_iterator1 === "Symbol(Symbol.iterator)"));
    assert(String(symbol_wellknown_iterator2 === "Symbol(Symbol.iterator)"));
    assert(symbol_wellknown_iterator1 === Symbol.iterator);
    assert(symbol_wellknown_iterator2 === Symbol.iterator);
    // Other Symbol
    const [symbol_foo1, symbol_foo2] = get("symbol_foo");
    assert(typeof symbol_foo1 === "symbol");
    assert(typeof symbol_foo2 === "symbol");
    assert(String(symbol_foo1 === "Symbol(foo)"));
    assert(String(symbol_foo2 === "Symbol(foo)"));
    const [symbol_foo3, symbol_foo4] = get("symbol_foo");
    assert(symbol_foo1 === symbol_foo3);
    assert(symbol_foo2 === symbol_foo4);
    // Array
    const [array1, array2] = get("array");
    assert(Array.isArray(array1));
    assert(Array.isArray(array2));
    // Arrow
    const [arrow_identity1, arrow_identity2] = get("arrow_identity");
    assert(typeof arrow_identity1 === "function");
    assert(typeof arrow_identity2 === "function");
    assert(!isconstructor(arrow_identity1));
    assert(!isconstructor(arrow_identity2));
    assert(Reflect.apply(arrow_identity1, null, ["foobar"]) === "foobar");
    assert(await arrow_identity2.apply(null, ["foobar"]) === "foobar");
    // Function
    const [function_this1, function_this2] = get("function_this");
    assert(typeof function_this1 === "function");
    assert(typeof function_this2 === "function");
    assert(isconstructor(function_this1));
    assert(isconstructor(function_this2));
    const [global1, global2] = get("global");
    assert(Reflect.apply(function_this1, null, []) === global1);
    assert(await function_this2.apply(null, []) === global2);
    const constructor = function () {};
    assert(Reflect.getPrototypeOf(Reflect.construct(function_this1, [], constructor)) === constructor.prototype);
    const x1 = await function_this2.construct([], constructor);
    const x2 = await x1.getPrototypeOf();
    assert(x2 === constructor.prototype);
    // Function Strict
    const [strict_function_this1, strict_function_this2] = get("strict_function_this");
    assert(typeof strict_function_this1 === "function");
    assert(typeof strict_function_this2 === "function");
    assert(isconstructor(strict_function_this1));
    assert(isconstructor(strict_function_this2));
    assert(Reflect.apply(strict_function_this1, "foobar", []) === "foobar");
    assert(await strict_function_this2.apply("foobar", []) === "foobar");
    // Object
    const [object1, object2] = get("object");
    assert(typeof object1 === "object");
    assert(typeof object2 === "object");
    assert(typeof object1 !== null);
    assert(typeof object2 !== null);
    const prototype = {__proto__:null};
    assert(Reflect.setPrototypeOf(object1, prototype) === true);
    assert(await object2.setPrototypeOf(prototype) === true);
    assert(Reflect.getPrototypeOf(object1) === prototype);
    assert(await object2.getPrototypeOf(prototype) === prototype);
    assert(Reflect.defineProperty(object1, "foo", {__proto__:null, value:123}) === true);
    assert(await object2.defineProperty("foo", {__proto__:null, value:123}) === true);
    assert(Reflect.getOwnPropertyDescriptor(object1, "foo").value === 123);
    assert((await object2.getOwnPropertyDescriptor("foo")).value === 123);
    assert(Reflect.set(object1, "bar", 123, object1) === true)
    assert(await object2.set("bar", 123, object2) === true);
    assert(Reflect.get(object1, "bar", object1) === 123);
    assert(await object2.get("bar", object2) === 123);
    assert(Reflect.has(object1, "bar") === true);
    assert(await object2.has("bar") === true);
    assert(Reflect.preventExtensions(object1) === true);
    assert(await object2.preventExtensions() === true);
    assert(Reflect.isExtensible(object1) === false);
    assert(await object2.isExtensible() === false);
    // Return
    return counter;
  };
  main().then((counter) => {
    console.log(counter+" assertions passed");
  }, (reason) => {
    console.log(reason);
  });
};
