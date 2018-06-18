const Check = require("lenient-proxy/check.js");
const Melf = require("melf");
const MelfShare = require("../main.js");
const Primitives = require("./primitives.js");

const assert = (check) => {
  if (!check) {
    throw new Error("Assertion failure");
  }
};

module.exports = (antena, callback) => {
  Melf(antena, "bob", (error, melf) => {
    if (error)
      throw error;
    share = MelfShare(melf, {synchronous:true});
    Object.keys(Primitives).forEach((key) => {
      const primitive = share.instantiate(melf.rpcall("alice", key));
      assert(primitive === Primitives[key] || (primitive !== primitive && Primitives[key] !== Primitives[key]));
    });
    const symbol_foo = share.instantiate(melf.rpcall("alice", "symbol_foo"));
    assert(typeof symbol_foo === "symbol");
    assert(String(symbol_foo) === "Symbol(foo)");
    assert(Symbol.keyFor(symbol_foo) === void 0);
    const symbol_iterator = share.instantiate(melf.rpcall("alice", "symbol_iterator"));
    assert(symbol_iterator === Symbol.iterator);
    const my_symbol_foo_global = Symbol.for("foo");
    const symbol_foo_global = share.instantiate(melf.rpcall("alice", "symbol_foo_global"));
    assert(symbol_foo_global === my_symbol_foo_global);
    Check.object(share.instantiate(melf.rpcall("alice", "object")));
    Check.array(share.instantiate(melf.rpcall("alice", "array")));
    Check.arrow(share.instantiate(melf.rpcall("alice", "arrow")));
    Check.function(share.instantiate(melf.rpcall("alice", "function")));
    console.log("All assertions passed!");
    callback();
  });
};
