const MelfReceptor = require("melf/receptor/worker");
const receptor = MelfReceptor({
  "alice": "key-a",
  "bob": "key-b"
});
const alice = receptor.spawn("alice-bundle.js");
setTimeout(function () {
  const bob = receptor.spawn("bob-bundle.js");
}, 2000);