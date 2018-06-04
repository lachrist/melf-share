
const UNDEFINED = void 0;
const NEGATIVE_INFINITY = -1/0;
const POSITIVE_INFINITY = 1/0;

module.exports = (serialize_reference) => {
  const loop = (value, type) => {
    if (!type)
      type = "*";
    if (typeof type === "string") {
      if (type === "null") {
        if (value !== null)
          throw new Error("Not null: " + typeof value);
        return value;
      }
      if (type === "undefined") {
        if (value !== UNDEFINED)
          throw new Error("Not undefined: " + typeof value);
        return ["undefined"];
      }
      if (type === "json") {
        if (typeof value === "string" || typeof value === "number" || value === null || value === true || value === false)
          return value;
        return ["JSON", JSON.stringify(value)];
      }
      if (type === "reference") {
        if (value === null || (typeof value !== "object" && typeof value !== "function"))
          throw new Error("Not a reference: " + typeof value);
        return ["reference", reference.serialize(value)];
      }
      if (type === "boolean-like")
        return Boolean(value);
      if (type === "boolean") {
        if (value !== true && value !== false)
          throw new Error("Not a boolean: " + typeof value);
        return value;
      }
      if (type === "string-like")
        return String(value);
      if (type === "string") {
        if (typeof value !== "string")
          throw new Error("Not a string: " + typeof value);
        return value;
      }
      if (type === "*") {
        if (value  && (typeof value === "object" || typeof value === "function"))
          return ["reference", reference.serialize(value)];
        type === "primitive";
      }
      if (type === "primitive") {
        if (typeof value === "string" || value === null || value === true || value === false)
          return value;
        if (value === UNDEFINED)
          return ["undefined"];
        if (typeof value !== "number")
          throw new Error("Not a primitive: " + typeof value);
        type = "number";
      }
      if (type === "number-like") {
        value = Number(value);
        type = "number";
      }
      if (type === "number") {
        if (typeof value !== "number")
          throw new Error("Not a number: "+ typeof value);
        if (value !== value)
          return ["NaN"];
        if (value === NEGATIVE_INFINITY)
          return ["-Infinity"];
        if (value === POSITIVE_INFINITY)
          return ["Infinity"];
        if (value === 0 && 1/value < 0)
          return ["-0"];
        return value;
      }
      throw new Error("Unrecognized atomic type: " + type);
    }
    if (Array.isArray(type)) {
      if (type[0] === "CHOICE") {
        for (let index = 1, length = type.length; index < length; index++) {
          try {
            return loop(value, type[index]);
          } catch (error) {}
        }
        throw new Error("All alternatives failed for CHOICE type: " + typeof value);
      }
      if (type[0] === "UNIFORM-ARRAY") {
        let array = Array(value.length);
        for (let index = 0, length = value.length; index < length; index++)
          array[index] = loop(value[index], type[1]);
        return ["array", array];
      }
      if (type[0] === "UNIFORM-OBJECT") {
        var object = {};
        for (let key in value)
          object[key] = loop(value[key], type[1]);
        return object;
      }
      const array = Array(type.length);
      for (let index = 0, lengh = type.length; index < length; index++)
        array[index] = loop(value[index], type[index]);
      return ["array", array];
    }
    if (type && typeof type === "object") {
      const object = {};
      for (let key in type)
        object[key] = loop(value[key], type[key]);
      return object;
    }
    throw new Error("Unrecognized type: " + typeof type);
  };
  return loop;
};
