const Antena = require("antena/node");
const Check = require("tolerant-proxy/check.js");
const Melf = require("melf");
const MelfSharing = require("../main.js");

Melf(new Antena(process.argv[2]), "bob", (error, melf) => {

  if (error)
    throw error;
  sharing = MelfSharing(melf, true);
  Check.object(melf.rpcall("alice", "object"));
  Checl


  console.log("Remote object");
  const object = sharing.instantiate(melf.rpcall("alice", "object"));
  assert(object && typeof object === "object");

  console.log("has, get, set, delete")
  assert(!Reflect.has(object, "foo"));
  assert(Reflect.set(object, "foo", 123, object));
  assert(Reflect.get(object, "foo", object) === 123);
  assert(Reflect.has(object, "foo"));
  assert(Reflect.deleteProperty(object, "foo"));
  assert(!Reflect.has(object, "foo"));

  console.log("setPrototypeOf, getPrototypeOf, get __proto__");
  const prototype1 = {"foo-proto":"123-proto"};
  assert(Reflect.setPrototypeOf(object, prototype1));
  assert(Reflect.get(object, "foo-proto") === "123-proto");
  assert(Reflect.getPrototypeOf(object) === prototype1)
  assert(Reflect.get(object, "__proto__", object) === prototype1);
  
  console.log("set __proto__, getPrototypeOf, get __proto__");
  const prototype2 = {};
  assert(Reflect.set(object, "__proto__", prototype2, object));
  assert(Reflect.getPrototypeOf(object) === prototype2)
  assert(Reflect.get(object, "__proto__", object) === prototype2);

  console.log("Reflect.ownkeys");
  Reflect.set(object, "key-a", "value-a");
  Reflect.set(object, "key-b", "value-b");
  const keys = Reflect.ownkeys(object);
  assert(keys.length === 2);
  assert(keys.includes("key-a"));
  assert(keys.includes("key-b"));

  console.log("Define data property");
  assert(Reflect.defineProperty(object, "bar", {value:456}));
  const descriptor = Reflect.getPropertyDescriptor(object, "bar");
  assert(descriptor.value === 456);
  assert(descriptor.writable === false);
  assert(descriptor.enumerable === false);
  assert(descriptor.configurable === false);

  console.log("Define accessor property");
  assert(Reflect.defineProperty(object, "qux", {
    get: function () {
      assert(this === object);
      return 789;
    },
    set: function (value) {
      assert(this === object);
    }
  }));
  Reflect.set(object, "qux", 0, object);
  assert(Reflect.get(object, "qux", 0) === 789);

  console.log("Extensilbe");
  assert(Reflect.isExtensible(object));
  assert(Reflect.preventExtensions(object));
  assert(!Reflect.isExtensible(object));
  assert(!Reflect.set(object, "foo", 123, object));
  assert(!Reflect.has(object, "foo"));

  console.log("Array");
  const array = sharing.instantiate(melf.rpcall("alice", "array"));
  assert(Array.isArray(array));
  array.push(1);
  array.push(2);
  array.push(3);
  const sum = 0;
  array.forEach((element) => {
    sum += element;
  });
  assert(sum === 6);

  process.exit(0);

});