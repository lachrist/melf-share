Reflect.ownKeys(Symbol).forEach((name) => {
  if (typeof Symbol[name] === "symbol") {
    exports[Symbol[name]] = name;
  }
});