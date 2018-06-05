
exports.getPrototypeOf = [[], "*"];
exports.setPrototypeOf = [["*"], "*"];
exports.isExtensible = [[], "*"];
exports.preventExtensions = [[], ["*"]];
exports.getOwnPropertyDescriptor = [["*"], {[Rest]:"*"}];
exports.defineProperty = [["*", {[Rest]:"*"}], "*"];
exports.has = [["*"], "*"];
exports.get = [["*", "*"], "*"];
exports.set = [["*", "*", "*"], "*"];
exports.deleteProperty = [["*"], "*"];
exports.ownKeys = [[], ["*"]];
exports.apply = [["*", ["*"]], "*"];
exports.construct = [["*"], "*"];



exports.getPrototypeOf = [
  [],
  ["EITHER", "null", "reference"]];
exports.setPrototypeOf = [
  [
    ["EITHER", "null", "reference"]],
  "boolean"];
exports.isExtensible = [
  [],
  "boolean"];
exports.preventExtensions = [
  [],
  "boolean"];
exports.getOwnPropertyDescriptor = [
  [
    ["EITHER", "shared-symbol", "to-string"]],
  [
    "EITHER",
    {
      value: "any",
      writable: "boolean",
      enumerable: "boolean",
      configurable: "boolean"},
    {
      get: ["EITHER", "undefined", "reference"],
      set: ["EITHER", "undefined", "reference"],
      enumerable: "boolean",
      configurable: "boolean"}]];
exports.defineProperty = [
  [
    ["EITHER", "shared-symbol", "string-like"],
    ["UNIFORM-OBJECT", "*"]],
  "boolean"];
exports.has = [
  [
    ["EITHER", "shared-symbol", "string-like"]],
  "boolean"];
exports.get = [
  [
    ["EITHER", "shared-symbol", "string-like"],
    "*"],
  "*"];
exports.set = [
  [
    ["EITHER", "shared-symbol", "string-like"],
    "*",
    "reference"],
  "boolean"];
exports.deleteProperty = [
  [
    ["EITHER", "shared-symbol", "string-like"]],
  "boolean"];
exports.ownKeys = [
  [],
  ["UNIFORM-ARRAY", "string"]];
exports.apply = [
  [
    "*",
    ["UNIFORM-ARRAY", "*"]],
  "*"];
exports.construct = [
  ["UNIFORM-ARRAY", "*"],
  "reference"];
