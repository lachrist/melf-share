
const Default = require("./default.js");

exports.getPrototypeOf = [[], "*"];
exports.setPrototypeOf = [["*"], "*"];
exports.isExtensible = [[], "*"];
exports.preventExtensions = [[], ["*"]];
exports.getOwnPropertyDescriptor = [["*"], {[Default]:"*"}];
exports.defineProperty = [["*", {[Default]:"*"}], "*"];
exports.has = [["*"], "*"];
exports.get = [["*", "*"], "*"];
exports.set = [["*", "*", "*"], "*"];
exports.deleteProperty = [["*"], "*"];
exports.ownKeys = [[], ["*"]];
exports.apply = [["*", ["*"]], "*"];
exports.construct = [["*"], "*"];
