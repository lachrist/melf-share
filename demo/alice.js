const Emitter = require("antena/emitter/worker");
const Melf = require("melf");
const Kalah = require("../main.js");
Melf({
  emitter: Emitter(),
  alias: "alice",
  key: "key-a"
}, (error, melf) => {
  if (error)
    throw error;
  const akalah = Kalah(melf, {
    sync: false,
    namespace: "foo"
  });
  const skalah = Kalah(melf, {
    sync: true,
    namespace: "bar"
  });
  melf.rprocedures["counter-async"] = (origin, data, callback) => {
    ((async () => {
      const f = akalah.import(data);
      const x = await f("foo");
      const y = await f("bar");
      const z = await f("qux");
      return x+y+z;
    }) ()).then((result) => callback(null, result), callback);
  };
  melf.rprocedures["counter-sync"] = (origin, data, callback) => {
    try {
      const f = skalah.import(data);
      const x = f("foo");
      const y = f("bar");
      const z = f("qux");
      callback(null, x+y+z);
    } catch (error) {
      callback(error);
    }
  };
});