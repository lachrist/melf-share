
const NAN = 0/0;
const UNDEFINED = void 0;
const NEGATIVE_INFINITY = -1/0;
const POSITIVE_INFINITY = 1/0;
const NEGATIVE_ZERO = -0;

module.exports = (instantiate_reference) => {
  const loop = (value) => {
    if (typeof value === "number" || typeof value == "string" || value === null || value === true || value === false)
      return value;
    if (Array.isArray(value)) {
      switch (value[0]) {
        case "NaN": return NAN;
        case "Infinity": return POSITIVE_INFINITY;
        case "-Infinity": return NEGATIVE_INFINITY;
        case "-0": return NEGATIVE_ZERO;
        case "undefined": return UNDEFINED;
        case "JSON": return JSON.parse(value[1]);
        case "reference": return instantiate_reference(value[1]);
        case "array": return value[1].map(loop);
        default: throw new Error("Unrecognized type tag: " + typeof value[0]);
      }
    }
    if (typeof value === "object") {
      const object = {};
      for (let key in value)
        object[key] = loop(value[key]);
      return object;
    }
  return loop;
};