
module.exports = (oids, refs, virtualize) => {
  const loop = (data) => {
    if (data === null || data === false  || data === true || typeof data === "number")
      return data;
    if (Array.isArray(data))
      return data.map(loop);
    if (typeof data === "object") {
      const keys = Reflect.ownKeys(data);
      for (let index = 0, length = keys.length; index < length; index++)
        data[keys[index]] = loop(data[keys[index]]);
      return data;
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
      return refs.get(remainder1);
    if (prefix1 === "symbol-wellknown")
      return Symbol[remainder1];
    if (prefix1 === "symbol-global")
      return Symbol.for(remainder1);
    if (prefix1 !== "symbol" && refs.has(remainder1))
      return refs.get(remainder1);
    const index2 = remainder1.indexOf("|");
    const prefix2 = remainder1.substring(0, index2);
    const remainder2 = remainder1.substring(index2 + 1);
    if (prefix1 !== "symbol") {
      const value = virtualize[prefix1](prefix2, remainder2);
      refs.set(remainder1, value);
      oids.set(value, remainder1);
      return value;
    }
    const index3 = remainder2.indexOf("|");
    const prefix3 = remainder2.substring(0, index3);
    const remainder3 = remainder2.substring(index3 + 1);
    if (refs.has(prefix2 + "|" + prefix3))
      return refs.get(prefix2 + "|" + prefix3);
    const value = Symbol(remainder3);
    refs.set(prefix2 + "|" + prefix3, value);
    oids.set(value, prefix2 + "|" + prefix3);
    return value;
  };
  return loop;
};
