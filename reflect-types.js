
// TODO make "symbol | string" possible

const descriptor = {
  configurable: "boolean",
  enumerable: "boolean",
  writable: "boolean",
  value: "any",
  get: ["CHOICE", "undefined", "reference"],
  set: ["CHOICE", "undefined", "reference"]
};

exports.getPrototypeOf = [[], ["CHOICE", "null", "reference"]];
exports.setPrototypeOf = [["CHOICE", "null", "reference"], "boolean"];
exports.isExtensible = [[], "boolean"];
exports.preventExtensions = [[], "boolean"];
exports.getOwnPropertyDescriptor = [["primitive"], "any"]; // TODO change return type to descriptor 
exports.defineProperty = [["primitive", descriptor], "boolean"];
exports.has = [["primitive"], "boolean"];
exports.get = [["primitive", "any"], "any"];
exports.set = [["primitive", "any", "any"], "boolean"];
exports.deleteProperty = [["primitive"], "boolean"];
exports.ownKeys = [[], ["UNIFORM-ARRAY", "string"]];
exports.apply = [["any", ["UNIFORM-ARRAY", "any"]], "any"];
exports.construct = [["UNIFORM-ARRAY", "any"], "any"]; // TODO change return type to reference
