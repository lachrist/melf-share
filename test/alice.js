const Antena = require("antena/node");
const Melf = require("melf");
const MelfSharing = require("../main.js");

Melf(new Antena(process.argv[2]), "alice", (error, melf) => {
  if (error)
    throw error;
  const sharing = MelfSharing(melf, false);
  melf.rprocedures.object = (origin, data, callback) => {
    callback(null, sharing.serialize({}));
  };
  melf.rprocedures.array = (origin, data, callback) => {
    callback(null, sharing.serialize([]));
  };
});