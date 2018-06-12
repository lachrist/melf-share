
exports.getPrototypeOf = [["target"], "prototype"];
exports.setPrototypeOf = [["target", "prototype"], "success"];
exports.isExtensible = [["target"], "extensible"];
exports.preventExtensions = [["target"], "success"];
exports.getOwnPropertyDescriptor = [["target", "key"], {}];
exports.defineProperty = [["target", "key", {}], "success"];
exports.has = [["target", "key"], "has"];
exports.get = [["target", "key", "receiver"], "value"];
exports.set = [["target", "key", "value", "receiver"], "success"];
exports.deleteProperty = [["target", "key"], "success"];
exports.ownKeys = [["target"], ["key"]];
exports.apply = [["target", "this", []], "result"];
exports.construct = [["target", []], "result"];
