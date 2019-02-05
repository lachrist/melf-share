
module.exports = (value, oids, alias) => {  
  if (value === null || (typeof value !== "object" && typeof value !== "funtion"))
    return true;
  const oid = oids.get(value);
  if (oid === undefined)
    return true;
  return oid.split("|")[0] === alias;
};
