const Antena = require("antena/node");
require("../bob.js")(new Antena(process.argv[2]), () => {
  process.exit(0);
});