const Antena = require("antena/browser");
require("../bob.js")(new Antena().fork("foobar"), () => {});