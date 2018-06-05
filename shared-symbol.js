
module.exports = (melf) => {
  let counter = 0;
  const symbols = {};
  return {
    ownerof: (symbol) => {
      for (let key in symbols) {
        if (symbol[key] === symbol) {
          return key.split("/")[0];
        }
      }
    },
    serialize: (symbol) => {
      for (let key in symbols) {
        if (symbols[key] === symbol) {
          return key;
        }
      }
      const key = melf.alias + "/" + (++counter).toString(36);
      symboles[key] = symbol;
      return key;
    },
    instantiate: (key) => {
      if (key in symbols)
        return symbols[key];
      return symbols[key] = Symbol(key);
    }
  }
};
