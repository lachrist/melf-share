const Emitter = require("antena/emitter/worker");
const Melf = require("melf");
const Kalah = require("../main.js");
Melf({
  emitter: Emitter(),
  alias: "bob",
  key: "key-b"
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
  let counter = 0;
  const increment = (message) => {
    console.log(message+" "+counter);
    return ++counter;
  };
  console.log("async-kalah "+melf.rcall("alice", "counter-async", akalah.export(increment)));
  console.log("sync-kalah "+melf.rcall("alice", "counter-sync", skalah.export(increment)));
});
