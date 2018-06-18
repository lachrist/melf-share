const Melf = require("melf");
const MelfShare = require("../main.js");
const Primitives = require("./primitives.js");

module.exports = (antena) => {
  Melf(antena, "alice", (error, melf) => {
    if (error)
      throw error;
    const share = MelfShare(melf, {synchronous:true});
    const values = Object.assign({
      object: {},
      array: [],
      arrow: () => {},
      function: function () {},
      symbol_foo: Symbol("foo"),
      symbol_iterator: Symbol.iterator,
      symbol_foo_global: Symbol.for("foo")
    }, Primitives);
    Object.keys(values).forEach((key) => {
      melf.rprocedures[key] = (origin, data, callback) => {
        callback(null, share.serialize(values[key]));
      }
    })
  });
};
