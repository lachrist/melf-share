
module.exports = (keys, values, virtual) => {
  const loop = (data) => {
    if (data === null || data === false  || data === true || typeof data === "number")
      return data;
    if (Array.isArray(data))
      return data.map(loop);
    if (typeof data === "object") {
      const object = {};
      for (let key in data)
        object[key] = loop(data[key]);
      return object;
    }
    if (data === "NaN")
      return NaN;
    if (data === "undefined")
      return undefined;
    if (data === "-Infinity")
      return -Infinity;
    if (data === "Infinity")
      return Infinity;
    if (data === "-0")
      return -0;
    const index1 = data.indexOf("|");
    const prefix1 = data.substring(0, index1);
    const remainder1 = data.substring(index1 + 1);
    if (prefix1 === "string")
      return remainder1;
    if (prefix1 === "target")
      return values.get(remainder1);
    if (prefix1 === "symbol-wellknown")
      return Symbol[remainder1];
    if (prefix1 === "symbol-global")
      return Symbol.for(remainder1);
    if (prefix1 !== "symbol" && values.has(remainder1))
      return values.get(remainder1);
    const index2 = remainder1.indexOf("|");
    const prefix2 = remainder1.substring(0, index2);
    const remainder2 = remainder1.substring(index2 + 1);
    if (prefix1 !== "symbol") {
      const value = virtual[prefix1](prefix2, remainder2);
      values.set(remainder1, value);
      keys.set(value, remainder1);
      return value;
    }
    const index3 = remainder2.indexOf("|");
    const prefix3 = remainder2.substring(0, index3);
    const remainder3 = remainder2.substring(index3 + 1);
    if (values.has(prefix2 + "|" + prefix3))
      return values.get(prefix2 + "|" + prefix3);
    const value = Symbol(remainder3);
    values.set(prefix2 + "|" + prefix3, value);
    keys.set(value, prefix2 + "|" + prefix3);
    return value;
  };
  return loop;
};
