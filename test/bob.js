
const Melf = require("melf");
const MelfShare = require("../lib/main.js");
const Primitives = require("./primitives.js");

module.exports = (address) => {
  let counter = 0;
  const assert = (check) => {
    if (!check)
      throw new Error("Assertion failure");
    counter++;
  };
  Melf(address, "bob", (error, melf) => {
    if (error)
      throw error;
    melf.catch((error) => { throw error });
    const done = (message) => {
      console.log(message);
      melf.rpcall("alice", "terminate", null);
      melf.terminate();
    };
    const main = async () => {
      share1 = MelfShare(melf, {synchronous:true, namespace:"sync"});
      share2 = MelfShare(melf, {synchronous:false, namespace:"async"});
      // We use async contruct to have the same communication between sync and async
      const isconstructor1 = (value) => {
        try {
          share1.reflect.construct(Boolean, [], value);
          return true;
        } catch (error) {
          return false;
        }
      };
      const isconstructor2 = async (value) => {
        try {
          await share2.reflect.construct(Boolean, [], value);
          return true;
        } catch (error) {
          return false;
        }
      };
      const get = (name) => {
        const array = melf.rpcall("alice", name, null);
        return [
          share1.instantiate(array[0]),
          share2.instantiate(array[1])
        ];
      };
      // Non Symbolic Primitives
      {
        Object.keys(Primitives).forEach((key) => {
          const [primitive1, primitive2] = get(key);
          assert(Object.is(Primitives[key], primitive1));
          assert(Object.is(Primitives[key], primitive2));
        });
      }
      // Global Symbol
      {
        const [symbol_global_foo1, symbol_global_foo2] = get("symbol_global_foo");
        assert(typeof symbol_global_foo1 === "symbol");
        assert(typeof symbol_global_foo2 === "symbol");
        assert(String(symbol_global_foo1 === "Symbol(foo)"));
        assert(String(symbol_global_foo2 === "Symbol(foo)"));
        assert(symbol_global_foo1 === Symbol.for("foo"));
        assert(symbol_global_foo2 === Symbol.for("foo"));
      }
      // Wellknown Symbol
      {
        const [symbol_wellknown_iterator1, symbol_wellknown_iterator2] = get("symbol_wellknown_iterator");
        assert(typeof symbol_wellknown_iterator1 === "symbol");
        assert(typeof symbol_wellknown_iterator2 === "symbol");
        assert(String(symbol_wellknown_iterator1 === "Symbol(Symbol.iterator)"));
        assert(String(symbol_wellknown_iterator2 === "Symbol(Symbol.iterator)"));
        assert(symbol_wellknown_iterator1 === Symbol.iterator);
        assert(symbol_wellknown_iterator2 === Symbol.iterator);
      }
      // Other Symbol
      {
        const [symbol_foo1, symbol_foo2] = get("symbol_foo");
        assert(typeof symbol_foo1 === "symbol");
        assert(typeof symbol_foo2 === "symbol");
        assert(String(symbol_foo1 === "Symbol(foo)"));
        assert(String(symbol_foo2 === "Symbol(foo)"));
        const [symbol_foo3, symbol_foo4] = get("symbol_foo");
        assert(symbol_foo1 === symbol_foo3);
        assert(symbol_foo2 === symbol_foo4);
      }
      // Array
      {
        const [array1, array2] = get("array");
        assert(Array.isArray(array1));
        assert(Array.isArray(array2));
      }
      // Arrow
      {
        const [arrow_identity1, arrow_identity2] = get("arrow_identity");
        assert(typeof arrow_identity1 === "function");
        assert(typeof arrow_identity2 === "function");
        assert(!       isconstructor1(arrow_identity1));
        assert(! await isconstructor2(arrow_identity2));
        assert(      share1.reflect.apply(arrow_identity1, null, ["foobar"]) === "foobar");
        assert(await share2.reflect.apply(arrow_identity2, null, ["foobar"]) === "foobar");
      }
      // Function
      {
        const [function_this1, function_this2] = get("function_this");
        assert(typeof function_this1 === "function");
        assert(typeof function_this2 === "function");
        assert(      isconstructor1(function_this1));
        assert(await isconstructor2(function_this2));
        const [global1, global2] = get("global");
        assert(      share1.reflect.apply(function_this1, null, []) === global1);
        assert(await share2.reflect.apply(function_this2, null, []) === global2);
        const constructor = function () {};
        assert(      share1.reflect.getPrototypeOf(share1.reflect.construct(function_this1, [], constructor)) === constructor.prototype);
        assert(await share2.reflect.getPrototypeOf(await share2.reflect.construct(function_this2, [], constructor)) === constructor.prototype);
      }
      // Function Strict
      {
        const [strict_function_this1, strict_function_this2] = get("strict_function_this");
        assert(typeof strict_function_this1 === "function");
        assert(typeof strict_function_this2 === "function");
        assert(      isconstructor1(strict_function_this1));
        assert(await isconstructor2(strict_function_this2));
        assert(      share1.reflect.apply(strict_function_this1, "foobar", []) === "foobar");
        assert(await share2.reflect.apply(strict_function_this2, "foobar", []) === "foobar");
      }
      // Object
      {
        const [object1, object2] = get("object");
        assert(typeof object1 === "object");
        assert(typeof object2 === "object");
        assert(typeof object1 !== null);
        assert(typeof object2 !== null);
        const prototype = {__proto__:null};
        assert(      share1.reflect.setPrototypeOf(object1, prototype) === true);
        assert(await share2.reflect.setPrototypeOf(object2, prototype) === true);
        assert(      share1.reflect.getPrototypeOf(object1) === prototype);
        assert(await share2.reflect.getPrototypeOf(object2) === prototype);
        assert(      share1.reflect.defineProperty(object1, "foo", {__proto__:null, value:123}) === true);
        assert(await share2.reflect.defineProperty(object2, "foo", {__proto__:null, value:123}) === true);
        assert((      share1.reflect.getOwnPropertyDescriptor(object1, "foo")).value === 123);
        assert((await share2.reflect.getOwnPropertyDescriptor(object2, "foo")).value === 123);
        assert(      share1.reflect.set(object1, "bar", 123, object1) === true)
        assert(await share2.reflect.set(object2, "bar", 123, object2) === true);
        assert(      share1.reflect.get(object1, "bar", object1) === 123);
        assert(await share2.reflect.get(object2, "bar", object2) === 123);
        assert(      share1.reflect.has(object1, "bar") === true);
        assert(await share2.reflect.has(object2, "bar") === true);
        assert(      share1.reflect.preventExtensions(object1) === true);
        assert(await share2.reflect.preventExtensions(object2) === true);
        assert(      share1.reflect.isExtensible(object1) === false);
        assert(await share2.reflect.isExtensible(object2) === false);
      }
      // toPrimitive
      {
        const object = {foo:123};
        const [object_symbol_primitive_foo1, object_symbol_primitive_foo2] = get("object_symbol_primitive_foo");
        assert(      share1.reflect.get(object, object_symbol_primitive_foo1) === 123);
        assert(await share2.reflect.get(object, object_symbol_primitive_foo2) === 123);
        const [object_toString_foo1, object_toString_foo2] = get("object_toString_foo");
        assert(      share1.reflect.get(object, object_toString_foo1) === 123);
        assert(await share2.reflect.get(object, object_toString_foo2) === 123);
      }
      // toPropertyDescriptor
      {
        const object1 = {__proto__:null};
        const object2 = {__proto__:null};
        const [data_descriptor1, data_descriptor2] = get("data_descriptor");
        assert(      share1.reflect.defineProperty(object1, "foo", data_descriptor1));
        assert(await share2.reflect.defineProperty(object2, "foo", data_descriptor2));
        assert(Reflect.getOwnPropertyDescriptor(object1, "foo").value === 123);
        assert(Reflect.getOwnPropertyDescriptor(object2, "foo").value === 123);
        assert(Reflect.getOwnPropertyDescriptor(object1, "foo").writable === true);
        assert(Reflect.getOwnPropertyDescriptor(object2, "foo").writable === true);
        assert(Reflect.getOwnPropertyDescriptor(object1, "foo").enumerable === true);
        assert(Reflect.getOwnPropertyDescriptor(object2, "foo").enumerable === true);
        assert(Reflect.getOwnPropertyDescriptor(object1, "foo").configurable === true);
        assert(Reflect.getOwnPropertyDescriptor(object2, "foo").configurable === true);
        const [accessor_descriptor1, accessor_descriptor2] = get("accessor_descriptor");
        assert(      share1.reflect.defineProperty(object1, "foo", accessor_descriptor1));
        assert(await share2.reflect.defineProperty(object2, "foo", accessor_descriptor2));
        assert(      share1.reflect.get(accessor_descriptor1, "get") ===  Reflect.getOwnPropertyDescriptor(object1, "foo").get);
        assert(await share2.reflect.get(accessor_descriptor2, "get") ===  Reflect.getOwnPropertyDescriptor(object2, "foo").get);
        assert(      share1.reflect.get(accessor_descriptor1, "set") ===  Reflect.getOwnPropertyDescriptor(object1, "foo").set);
        assert(await share2.reflect.get(accessor_descriptor2, "set") ===  Reflect.getOwnPropertyDescriptor(object2, "foo").set);
        assert(Reflect.getOwnPropertyDescriptor(object1, "foo").enumerable === true);
        assert(Reflect.getOwnPropertyDescriptor(object2, "foo").enumerable === true);
        assert(Reflect.getOwnPropertyDescriptor(object1, "foo").configurable === true);
        assert(Reflect.getOwnPropertyDescriptor(object2, "foo").configurable === true);
      }
      // Unary
      {
        const [object_valueOf_123_1, object_valueOf_123_2] = get("object_valueOf_123");
        assert(      share1.reflect.unary("-", object_valueOf_123_1) === -123);
        assert(await share2.reflect.unary("-", object_valueOf_123_2) === -123);
      }
      // ==
      {
        const [object_symbol_primitive_foo1, object_symbol_primitive_foo2] = get("object_symbol_primitive_foo");
        assert(      share1.reflect.binary("==", object_symbol_primitive_foo1, "foo") === true);
        assert(await share2.reflect.binary("==", object_symbol_primitive_foo2, "foo") === true);
      }
      // Binary
      {
        const [object_valueOf_123_1, object_valueOf_123_2] = get("object_valueOf_123");
        assert(      share1.reflect.binary("+", object_valueOf_123_1, 1) === 124);
        assert(await share2.reflect.binary("+", object_valueOf_123_2, 1) === 124);
      }
      // Return
      return counter;
    };
    main().then((counter) => {
      done(counter+" assertions passed");
    }, (reason) => {
      done(String(reason))
    });
  });
};
