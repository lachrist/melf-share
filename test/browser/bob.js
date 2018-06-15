const Antena = require("antena/browser");
require("../bob.js")(new Antena().fork("foobar"), () => {
  new Antena().request("GET", "/close", {}, "");
});