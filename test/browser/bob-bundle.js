(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

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

},{}],2:[function(require,module,exports){

const Serialize = require("./serialize.js");
const Instantiate = require("./instantiate.js");
const VirtualizeSync = require("./virtualize-sync.js");
const VirtualizeAsync = require("./virtualize-async.js");

module.exports = (melf, options) => {
  const oids = new Map();
  const refs = new Map();
  const virtualize = {__proto__:null};
  const serialize = Serialize(oids, refs, melf.alias);
  const instantiate = Instantiate(oids, refs, virtualize);
  Object.assign(virtualize, (options.synchronous ? VirtualizeSync : VirtualizeAsync)(melf, serialize, instantiate, options.namespace));
  return {
    serialize,
    instantiate,
    reflect: virtualize.reflect,
    ownerof: (value) => {
      const oid = oids.get(value);
      return oid ? oid.split("|")[0] : melf.alias;
    },
    discard: (value) => {
      const oid = oids.get(value);
      if (oid) {
        oids.delete(value);
        refs.delete(id);
      }
      return Boolean(oid);
    }
  };
};

},{"./instantiate.js":1,"./serialize.js":6,"./virtualize-async.js":7,"./virtualize-sync.js":8}],3:[function(require,module,exports){

const ReflectSync = require("./reflect-sync.js");

module.exports = (handlers, remotes) => {

  const reflect = {};

  // https://tc39.github.io/ecma262/#sec-abstract-equality-comparison
  const equalityComparison = async (value1, value2) => {
    if (value1 !== null && (typeof value1 === "object" || typeof value1 === "function")) {
      if (value2 !== null && (typeof value2 === "object" || typeof value2 === "function"))
        return value1 === value2;
      return await toPrimitive(value1) == value2;
    }
    if (value2 !== null && (typeof value2 === "object" || typeof value2 === "function"))
      return value1 == await toPrimitive(value2);
    return value1 == value2;
  };

  // https://www.ecma-international.org/ecma-262/9.0/index.html#sec-toprimitive
  const toPrimitive = async (value, hint) => {
    if (value === null || (typeof value !== "object" && typeof value !== "function"))
      return value;
    const toPrimitive = await reflect.get(value, Symbol.toPrimitive);
    if (toPrimitive !== undefined) {
      value = await reflect.apply(toPrimitive, value, [hint]);
    } else {
      const method1 = await reflect.get(value, hint === "string" ? "toString" : "valueOf");
      if (typeof method1 === "function") {
        value = await reflect.apply(method1, value, []);
      } else {
        const method2 = await reflect.get(value, hint === "string" ? "valueOf" : "toString");
        if (method2 === "function") {
          value = await reflect.apply(method2, value, []);
        }
      }
    }
    if (value !== null && (typeof value === "object" || typeof value === "function"))
      throw new TypeError("Cannot convert object to primitive value");
    return value;
  };

  // https://www.ecma-international.org/ecma-262/9.0/index.html#sec-hasproperty
  const hasProperty = async (value, key) => {
    while (value) {
      if (await reflect.getOwnPropertyDescriptor(value, key))
        return true;
      value = await reflect.getPrototypeOf(value);
    }
    return false;
  };
  
  // https://www.ecma-international.org/ecma-262/9.0/index.html#sec-topropertydescriptor
  const toPropertyDescriptor = async (value) => {
    const descriptor = {__proto__:null};
    const keys = ["value", "writable", "get", "set", "enumerable", "configurable"];
    for (let index = 0; index < keys.length; index++) {
      if (await hasProperty(value, keys[index])) {
        descriptor[keys[index]] = await reflect.get(value, keys[index]);
      }
    }
    return descriptor;
  };
  
  reflect.getPrototypeOf = async (target) => {
    if (remotes.has(target))
      return handlers.getPrototypeOf(target);
    return Reflect.getPrototypeOf(target);
  };

  reflect.setPrototypeOf = async (target, prototype) => {
    if (remotes.has(target))
      return handlers.setPrototypeOf(target, prototype);
    return Reflect.setPrototypeOf(target, prototype);
  };

  reflect.isExtensible = async (target) => {
    if (remotes.has(target))
      return handlers.isExtensible(target);
    return Reflect.isExtensible(target);
  };

  reflect.preventExtensions = async (target) => {
    if (remotes.has(target))
      return handlers.preventExtensions(target);
    return Reflect.preventExtensions(target);
  };

  reflect.apply = async (target, value, values) => {
    if (remotes.has(target))
      return handlers.apply(target, value, values);    
    const array = [];
    const length = await reflect.get(values, "length");
    for (let index = 0; index < length; index++)
      array[index] = await reflect.get(values, index);
    return Reflect.apply(target, value, array);
  };
  
  reflect.construct = async (target, values, ...rest) => {
    if (remotes.has(target))
      return handlers.construct(target, values, ...rest);
    const array = [];
    const length = await reflect.get(values, "length");
    for (let index = 0; index < length; index++)
      array[index] = await reflect.get(values, index);
    if (rest.length) {
      Reflect.construct(Boolean, [], rest[0]);
      const prototype = await reflect.get(rest[0], "prototype");
      rest[0] = function () {};
      rest[0].prototype = prototype;
    }
    return Reflect.construct(target, array, ...rest);
  };

  reflect.getOwnPropertyDescriptor = async (target, key) => {
    if (remotes.has(target))
      return handlers.getOwnPropertyDescriptor(target, key);
    if (remotes.has(key))
      key = await toPrimitive(key, "string");
    return Reflect.getOwnPropertyDescriptor(target, key);
  };

  reflect.defineProperty = async (target, key, descriptor) => {
    if (remotes.has(target))
      return handlers.defineProperty(target, key, descriptor);
    if (remotes.has(key))
      key = await toPrimitive(key, "string");
    descriptor = await toPropertyDescriptor(descriptor);
    return Reflect.defineProperty(target, key, descriptor);
  };

  reflect.deleteProperty = async (target, key) => {
    if (remotes.has(target))
      return handlers.deleteProperty(target, key);
    if (remotes.has(key))
      key = await toPrimitive(key, "string");
    return Reflect.deleteProperty(target, key);
  };

  reflect.has = async (target, key) => {
    if (await reflect.getOwnPropertyDescriptor(target, key))
      return true;
    const prototype = await reflect.getPrototypeOf(target);
    if (prototype === null)
      return false;
    return await reflect.has(prototype, key);
  };

  reflect.get = async (target, key, ...rest) => {
    const descriptor = await reflect.getOwnPropertyDescriptor(target, key);
    if (descriptor) {
      if (Reflect.getOwnPropertyDescriptor(descriptor, "value"))
        return descriptor.value;
      if (descriptor.get)
        return await reflect.apply(descriptor.get, rest.length ? rest[0] : target, []);
      return undefined;
    }
    const prototype = await reflect.getPrototypeOf(target);
    if (prototype === null)
      return undefined;
    return await reflect.get(prototype, key, value, ...rest);
  };
  
  reflect.set = async (target, key, value, ...rest) => {
    let descriptor = await reflect.getOwnPropertyDescriptor(target, key);
    if (descriptor) {
      if (Reflect.getOwnPropertyDescriptor(descriptor, "value")) {
        if (!descriptor.writable) {
          return false;
        }
      } else {
        if (descriptor.set) {
          await reflect.apply(descriptor.set, rest.length ? rest[0] : target, []);
          return true;
        }
        return false;
      }
    } else {
      const prototype = await reflect.getPrototypeOf(target);
      if (prototype !== null) {
        return await reflect.set(prototype, key, value, ...rest);
      }
    }
    descriptor = (await reflect.getOwnPropertyDescriptor(rest.length ? rest[0] : target) || {
      value: undefined,
      writable: true,
      enumerable: true,
      configurable: true
    });
    if (!Reflect.getOwnPropertyDescriptor(descriptor, "value"))
      return false;
    if (!descriptor.writable)
      return false;
    descriptor.value = value;
    await reflect.defineProperty(rest.length ? rest[0] : target, key, descriptor);
    return true;
  };
  
  reflect.unary = async (operator, argument) => {
    if (operator === "typeof")
      return typeof argument;
    if (operator === "void")
      return undefined;
    if (operator === "delete")
      return true;
    return ReflectSync.unary(operator, await toPrimitive(argument));
  };
  
  reflect.binary = async (operator, left, right) => {
    if (operator === "in")
      return reflect.has(right, left);
    if (operator === "===")
      return left === right;
    if (operator === "!==")
      return left !== right;
    if (operator === "==")
      return equalityComparison(left, right);
    if (operator === "!=")
      return !equalityComparison(left, right);
    if (operator === "instanceof") {
      Reflect.construct(Boolean, [], right);
      if (left === null || (typeof left !== "object" && typeof left !== "function"))
        return false;
      left = await reflect.getPrototypeOf(left);
      const prototype = await reflect.get(right, "prototype");
      while (left) {
        if (left === prototype)
          return true;
        left = await reflect.getPrototypeOf(left);
      }
      return false;
    }
    return ReflectSync.binary(operator, await toPrimitive(left), await toPrimitive(right));
  };
  
  return reflect;

};

},{"./reflect-sync.js":4}],4:[function(require,module,exports){

module.exports = {
  __proto__: Reflect,
  unary: (operator, argument) => {
    switch (operator) {
      case "-":      return -      argument;
      case "+":      return +      argument;
      case "!":      return !      argument;
      case "~":      return ~      argument;
      case "typeof": return typeof argument;
      case "void":   return void   argument;
      case "delete": return delete argument;
    }
    throw new Error("Invalid unary operator: "+operator);
  },
  binary: (operator, left, right) => {
    switch (operator) {
      case "==":  return left ==  right;
      case "!=":  return left !=  right;
      case "===": return left === right;
      case "!==": return left !== right;
      case "<":   return left <   right;
      case "<=":  return left <=  right;
      case ">":   return left >   right;
      case ">=":  return left >=  right;
      case "<<":  return left <<  right;
      case ">>":  return left >>  right;
      case ">>>": return left >>> right;
      case "+":   return left +   right;
      case "-":   return left -   right;
      case "*":   return left *   right;
      case "/":   return left /   right;
      case "%":   return left %   right;
      case "|":   return left |   right;
      case "^":   return left ^   right;
      case "&":   return left &   right;
      case "in":  return left in  right;
      case "instanceof": return left instanceof right;
    }
    throw new Error("Invalid binary operator: "+operator);
  }
};



},{}],5:[function(require,module,exports){

exports.getPrototypeOf = [["target"], null];
exports.setPrototypeOf = [["target", null], null];
exports.isExtensible = [["target"], null];
exports.preventExtensions = [["target"], null];
exports.getOwnPropertyDescriptor = [["target", "string"], {}];
exports.defineProperty = [["target", "string", {}], null];
// exports.has = [["target", "string"], null];
// exports.get = [["target", "string", null], null];
// exports.set = [["target", "string", null, null], null];
exports.deleteProperty = [["target", "string"], null];
exports.ownKeys = [["target"], []];
exports.apply = [["target", null, []], null];
exports.construct = [["target", [], null], null];

},{}],6:[function(require,module,exports){

const wellkown = {__proto__:null};
Reflect.ownKeys(Symbol).forEach((name) => {
  if (typeof Symbol[name] === "symbol") {
    wellkown[Symbol[name]] = name;
  }
});

const has = (object, key) => {
  while (object) {
    if (Reflect.getOwnPropertyDescriptor(object, key))
      return true;
    object = Reflect.getPrototypeOf(object);
  }
  return false;
};

const miss = Symbol("miss");

module.exports = (oids, refs, alias) => {

  let counter = 0;
  
  const oidof = (ref) => {
    let oid = oids.get(ref);
    if (oid)
      return oid;
    oid = alias + "|" + (++counter).toString(36);
    oids.set(ref, oid);
    refs.set(oid, ref);
    return oid;
  };
  
  const owned = (value) => {  
    if (value === null || (typeof value !== "object" && typeof value !== "function"))
      return true;
    const oid = oids.get(value);
    if (oid === undefined)
      return true;
    return oid.split("|")[0] === alias;
  };

  const get = (target, key, receiver) => {
    while (target) {
      if (!owned(target))
        return miss;
      const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
      if (descriptor) {
        if (Reflect.getOwnPropertyDescriptor(descriptor, "value"))
          return descriptor.value;
        if (descriptor.get) {
          if (owned(descriptor.get))
            return Reflect.apply(descriptor.get, receiver, []);
          return miss;
        }
        return undefined
      }
      target = Reflect.getPrototypeOf(target);
    }
    return undefined;
  };

  const loop = (value, hint) => {
    if (hint === "target")
      return "target|" + value.alias + "|" + value.token;
    miss: if (Array.isArray(hint) && value !== null && (typeof value === "object" || typeof value === "function")) {
      const length = get(value, "length", value);
      if (length === miss)
        break miss;
      const array = Array(length);
      for (let index = 0; index < length; index++) {
        array[index] = loop(get(value, index, value), hint[index]);
        if (array[index] === miss) {
          break miss;
        }
      }
      return array;
    }
    miss: if (hint !== null && typeof hint === "object" && value !== null && (typeof value === "object" || typeof value === "function")) {
      const object = {__proto__:null};
      let target = value;
      while (target) {
        if (!owned(target))
          break miss;
        const keys = Object.keys(target);
        for (let index = 0; index < keys.length; index++) {
          object[keys[index]] = loop(get(target, keys[index], target), hint[keys[index]]);
          if (object[keys[index]] === miss) {
            break miss;
          }
        }
        target = Reflect.getPrototypeOf(target);
      }
      return object;
    }
    miss: if ((hint === "number" || hint === "default" || hint === "string") && value !== null && (typeof value === "object" || typeof value === "function")) {
      // https://www.ecma-international.org/ecma-262/9.0/index.html#sec-toprimitive
      const toPrimitive = get(value, Symbol.toPrimitive, value);
      if (toPrimitive === miss || !owned(toPrimitive))
        break miss;
      if (toPrimitive !== undefined) {
        value = Reflect.apply(toPrimitive, value, [hint]);
      } else {
        const method1 = get(value, hint === "string" ? "toString" : "valueOf", value);
        if (method1 === miss || !owned(method1))
          break miss;
        if (typeof method1 === "function") {
          value = Reflect.apply(method1, value, []);
        } else {
          const method2 = get(value, hint === "string" ? "valueOf" : "toString", value);
          if (method2 === miss || !owned(method2))
            break miss;
          if (typeof method2 === "function") {
            value = Reflect.apply(method2, value, []);
          }
        }
      }
    }
    switch (typeof value) {
      case "undefined": return "undefined";
      case "boolean": return value;
      case "number":
        if (value !== value)
          return "NaN";
        if (value === -Infinity)
          return "-Infinity";
        if (value === Infinity)
          return "Infinity";
        if (value === 0 && 1/value === -Infinity)
          return "-0";
        return value;
      case "string": return "string|" + value;
      case "symbol":
        if (value in wellkown)
          return "symbol-wellknown|" + wellkown[value];
        if (Symbol.keyFor(value) !== undefined)
          return "symbol-global|" + Symbol.keyFor(value);
        return "symbol|" + oidof(value) + "|" + String(value).slice(7, -1);
      case "object":
        if (value === null)
          return null;
        if (Array.isArray(value))
          return "array|" + oidof(value);
        return "object|" + oidof(value);
      case "function":
        try {
          Reflect.construct(Boolean, [], value);
        } catch (error) {
          return "arrow|" + oidof(value);
        }
        return "function|" + oidof(value);
    }
    throw new Error("Unrecognized type: " + typeof value);
  };
  return loop;
};

},{}],7:[function(require,module,exports){

const ReflectTyping = require("./reflect-typing.js");
const ReflectAsync = require("./reflect-async.js");

module.exports = (melf, serialize, instantiate, namespace) => {
  const handlers = {__proto__:null};
  const prototype = {__proto__:null};
  const remotes = new WeakSet();
  const reflect = ReflectAsync(handlers, remotes);
  Reflect.ownKeys(ReflectTyping).forEach((key) => {
    const name = "melf-share-" + (namespace ? namespace + "-" : "") + key;
    const types = ReflectTyping[key][0];
    const type = ReflectTyping[key][1];
    handlers[key] = (...data) => {
      const alias = data[0].alias;
      for (let index = 0, length = data.length; index < length; index++)
        data[index] = serialize(data[index], types[index]);
      return new Promise((resolve, reject) => {
        melf.rpcall(alias, name, data, (error, data) => {
          if (error)
            return reject(error);
          resolve(instantiate(data));
        });
      });
    };
    melf.rprocedures[name] = (origin, data, callback) => {
      reflect[key](...data.map(instantiate)).then((result) => {
        callback(null, serialize(result, type));
      }, callback);
    };
  });
  Reflect.ownKeys(Reflect).forEach((key) => {
    const handler = handlers[key];
    prototype[key] = function (...data) {
      return handler(this, ...data);
    }
  });
  const helper = (alias, token, target) => {
    remotes.add(target);
    Reflect.setPrototypeOf(target, prototype);
    target.alias = alias;
    target.token = token;
    return target;
  }
  return {
    __proto__: null,
    reflect: reflect,
    object: (alias, token) => helper(alias, token, {}),
    array: (alias, token) => helper(alias, token, []),
    arrow: (alias, token) => helper(alias, token, () => {}),
    function: (alias, token) => helper(alias, token, function () {})
  };
};

},{"./reflect-async.js":3,"./reflect-typing.js":5}],8:[function(require,module,exports){

const VirtualProxy = require("virtual-proxy");
const ReflectTyping = require("./reflect-typing.js");
const ReflectSync = require("./reflect-sync.js");

module.exports = (melf, serialize, instantiate, namespace) => {
  const handlers = {__proto__:null};
  Reflect.ownKeys(ReflectTyping).forEach((key) => {
    const name = namespace ? "melf-share-" + namespace + "-" + key : "melf-share-" + key;
    const types = ReflectTyping[key][0];
    const type = ReflectTyping[key][1];
    handlers[key] = (...data) => {
      const alias = data[0].alias;
      for (let index = 0, length = data.length; index < length; index++)
        data[index] = serialize(data[index], types[index]);
      return instantiate(melf.rpcall(alias, name, data));
    };
    melf.rprocedures[name] = (origin, data, callback) => {
      try {
        callback(null, serialize(Reflect[key](...data.map(instantiate)), type));
      } catch (error) {
        callback(error);
      }
    };
  });
  return {
    __proto__: null,
    reflect: ReflectSync,
    object: (alias, token) => VirtualProxy({}, {__proto__:null, alias, token}, handlers),
    array: (alias, token) => VirtualProxy([], {__proto__:null, alias, token}, handlers),
    arrow: (alias, token) => VirtualProxy(() => {}, {__proto__:null, alias, token}, handlers),
    // We use a strict function as shadow target so that the caller and arguments fileds are not defined
    function: (alias, token) => VirtualProxy(function () { "use strict" }, {__proto__:null, alias, token}, handlers),
  };
};

},{"./reflect-sync.js":4,"./reflect-typing.js":5,"virtual-proxy":13}],9:[function(require,module,exports){

const StandalonePromise = require("../standalone-promise.js")

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

module.exports = (options = {}, session, callback) => {
  if (typeof options === "string")
    options = {splitter:options};
  const secure = options.secure || location.protocol === "https:" ? "s" : "";
  const hostname = options.hostname || location.hostname;
  const port = (options.port||location.port) ? ":" + (options.port||location.port) : "";
  const splitter = options.splitter || "__antena__";
  const websocket = new WebSocket("ws"+secure+"://"+hostname+port+"/"+splitter+"/"+session);
  websocket.onclose = (event) => {
    callback(new Error("Websocket closed: "+event.code+" "+event.reason));
  };
  websocket.onmessage = ({data:token}) => {
    const emitter = StandalonePromise();
    emitter._pending = true;
    emitter._url1 = "http"+secure+"://"+hostname+port+"/"+splitter+"/+"+token;
    emitter._url2 = "http"+secure+"://"+hostname+port+"/"+splitter+"/*"+token;
    emitter._url3 = "http"+secure+"://"+hostname+port+"/"+splitter+"/."+token;
    emitter._websocket = websocket;
    emitter.destroy = destroy;
    emitter.terminate = terminate;
    emitter.pull = pull;
    emitter.post = post;
    emitter.onpush = onpush;
    emitter.onterminate = onterminate;
    websocket._antena_emitter = emitter;
    websocket.onmessage = onmessage;
    websocket.onclose = onclose;
    callback(null, emitter);
  };
};

////////////
// Helper //
////////////

const failure = (emitter, error) => {
  if (emitter._pending) {
    if (emitter._websocket.readyState !== OPEN)
      emitter._websocket.close(1001);
    emitter._pending = false;
    emitter._reject(error);
  }
};

const success = (emitter) => {
  if (emitter._pending) {
    emitter.onterminate();
    if (emitter._pending) {
      const request = new XMLHttpRequest();
      request.open("GET", emitter._url3, false);
      request.setRequestHeader("Cache-Control", "no-cache");
      request.setRequestHeader("User-Agent", "*");
      try {
        request.send();
      } catch (error) {
        return failure(emitter, error);
      }
      if (request.status !== 200)
        return failure(emitter, new Error("HTTP Error: "+request.status+" "+request.statusText));
      emitter._pending = false;
      emitter._resolve(null);  
    }
  }
};

///////////////
// WebSocket //
///////////////

function onmessage ({data}) {
  this._antena_emitter.onpush(data);
}

function onclose ({wasClean, code, reason}) {
  if (wasClean) {
    if (code === 1000) {
      success(this._antena_emitter)
    } else {
      failure(this._antena_emitter, new Error("Abnormal websocket closure: "+code+" "+reason));
    }
  } else {
    failure(this._antena_emitter, new Error("Unclean websocket closure"));
  }
}

//////////////
// Emitter  //
//////////////

const onpush = (message) => {
  throw new Error("Lost a push message: "+message);
};

const onterminate = () => {};

function terminate () {
  if (this._websocket.readyState !== OPEN)
    return false;
  this._websocket.close(1000);
  return true;
}

function destroy () {
  if (!this._url1)
    return false;
  failure(this, new Error("Destroyed by the user"));
  return true;
}

function post (message) {
  if (this._pending) {
    if (this._websocket.readyState === OPEN) {
      this._websocket.send(message);
    } else {
      const request = new XMLHttpRequest();
      request.open("PUT", this._url2, true);
      request.setRequestHeader("User-Agent", "*");
      try {
        request.send(message);
      } catch (error) {
        failure(this, error);
      }
    }
  }
  return this._pending;
}

function pull (message) {
  if (this._pending) {
    const request = new XMLHttpRequest();
    if (message) {
      request.open("PUT", this._url1, false);
    } else {
      request.open("GET", this._url1, false);
      request.setRequestHeader("Cache-Control", "no-cache");
    }
    request.setRequestHeader("User-Agent", "*");
    try {
      request.send(message);
    } catch (error) {
      failure(this, error);
      return null;
    }
    if (request.status === 200)
      return request.responseText;
    failure(this, new Error("HTTP Error: "+request.status+" "+request.statusText));
  }
  return null;
}

},{"../standalone-promise.js":11}],10:[function(require,module,exports){
(function (process){
// https://github.com/iliakan/detect-node
if (Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]") {
  const browserify_do_no_require1 = "./mock/emitter.js";
  const browserify_do_no_require2 = "./node/emitter.js";
  const MockEmitter = require(browserify_do_no_require1);
  const NodeEmitter = require(browserify_do_no_require2);
  module.exports = (address, session, callback) => (typeof address === "object" ? MockEmitter : NodeEmitter)(address, session, callback);
} else {
  module.exports = require("./browser/emitter.js");
}
}).call(this,require('_process'))
},{"./browser/emitter.js":9,"_process":17}],11:[function(require,module,exports){

// https://tc39.github.io/ecma262/#sec-properties-of-promise-instances

module.exports = () => {
  let reject, resolve;
  const promise = new Promise((closure1, closure2) => {
    resolve = closure1;
    reject = closure2;
  });
  promise._pending = true;
  promise._reject = reject;
  promise._resolve = resolve;
  return promise;
};

},{}],12:[function(require,module,exports){

// alias#token%rpname/body
// &token/body
// |token/body

const AntenaEmitter = require("antena/lib/emitter");

const max = parseInt("zzzzzz", 36);

const rpcallhelper = (melf, recipient, rpname, data, callback) => {
  melf._counter++;
  if (melf._counter === max)
    melf._counter = 1;
  const token = melf._counter.toString(36);
  melf._callbacks[token] = callback;
  return recipient+"/"+melf.alias+"#"+token+"%"+rpname+"/"+JSON.stringify(data);
};

const localize = (alias) => (line) => line.startsWith("    at ") ?
  "    " + alias + " " + line.substring(4) :
  line;

const makeonmeteor = (melf) => (meteor) => {
  const head = meteor.substring(0, meteor.indexOf("/"));
  if (!melf._done.delete(head)) {
    melf._done.add(head);
    const body = JSON.parse(meteor.substring(head.length+1));
    if (head[0] === "&" || head[0] === "|") {
      const token = head.substring(1);
      const callback = melf._callbacks[token];
      delete melf._callbacks[token];
      if (head[0] === "&") {
        callback(null, body);
      } else {
        error = new Error(body[1]);
        error.name = body[0];
        error.stack = body[0]+": "+body[1]+"\n"+body[2].join("\n");
        callback(error);
      }
    } else {
      const alias = head.substring(0, head.indexOf("#"));
      const token = head.substring(alias.length+1, head.indexOf("%"));
      const pname = head.substring(alias.length+1+token.length+1);
      const callback = (error, result) => {
        if (error) {
          const lines = error.stack.substring(error.name.length + 2 + error.message.length + 1).split("\n");
          melf._emitter.post(alias+"/|"+token+"/"+JSON.stringify([error.name, error.message, lines.map(localize(melf.alias))]));
        } else {
          melf._emitter.post(alias+"/&"+token+"/"+JSON.stringify(result));
        }
      };
      if (pname in melf.rprocedures) {
        melf.rprocedures[pname](alias, body, callback);
      } else {
        callback(new Error("Procedure not found: "+pname));
      }
    }
  }
};

function rpcall (recipient, rpname, data, callback) {
  if (callback)
    return this._emitter.post(rpcallhelper(this, recipient, rpname, data, callback));
  let pending = true;
  let result = null;
  this._emitter.pull(rpcallhelper(this, recipient, rpname, data, (error, data) => {
    if (error) {
      error.stack = (
        error.name + ": " +
        error.message + "\n" +
        error.stack.substring(error.name.length+2+error.message.length+1) + "\n" +
        (new Error("foo")).stack.substring("Error: foo\n".length).split("\n").map(localize(this.alias)).join("\n"));
      throw error;
    }
    pending = false;
    result = data;
  })).split("\n").forEach(this._onmeteor);
  while (pending)
    this._emitter.pull("").split("\n").forEach(this._onmeteor);
  return result;
}

function terminate () {
  return this._emitter.terminate();
}

function destroy () {
  return this._emitter.destroy();
}

function onterminate () {
  this._melf.onterminate();
};

const noop = () => {};

module.exports = (address, alias, callback) => {
  if (address && typeof address === "object" && "_receptor" in address)
    address = address._receptor;
  AntenaEmitter(address, alias, (error, emitter) => {
    if (error)
      return callback(error);
    const melf = new Promise((resolve, reject) => { emitter.then(resolve, reject) });
    const onmeteor = makeonmeteor(melf);
    melf._emitter = emitter;
    melf._callbacks = {__proto__:null};
    melf._counter = 0;
    melf._done = new Set();
    melf._onmeteor = onmeteor;
    melf.rprocedures = {__proto__:null};
    melf.rpcall = rpcall;
    melf.alias = alias;
    melf.destroy = destroy;
    melf.terminate = terminate;
    melf.onterminate = noop;
    emitter._melf = melf;
    emitter.onpush = onmeteor;
    emitter.onterminate = onterminate;
    callback(null, melf);
  });
};

},{"antena/lib/emitter":10}],13:[function(require,module,exports){
(function (global){

const Proxy = global.Proxy;
const Boolean = global.Boolean;
const TypeError = global.TypeError;

const Reflect_apply = Reflect.apply;
const Reflect_construct = Reflect.construct;
const Reflect_defineProperty = Reflect.defineProperty;
const Reflect_deleteProperty = Reflect.deleteProperty;
const Reflect_get = Reflect.get;
const Reflect_getOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;
const Reflect_getPrototypeOf = Reflect.getPrototypeOf;
const Reflect_has = Reflect.has;
const Reflect_isExtensible = Reflect.isExtensible;
const Reflect_preventExtensions = Reflect.preventExtensions;
const Reflect_ownKeys = Reflect.ownKeys;
const Reflect_set = Reflect.set;
const Reflect_setPrototypeOf = Reflect.setPrototypeOf;

// https://tc39.github.io/ecma262/#sec-invariants-of-the-essential-internal-methods

const handler = {__proto__:null};

//////////////
// Function //
//////////////
// The target must be a callable itself. That is, it must be a function object.
handler.apply = function (target, value, values) {
  if (typeof target !== "function")
    throw new TypeError("Target is not a function");
  return this.__handler__.apply(this.__target__, value, values);
};
// [RELEGATED] The result must be an Object.
handler.construct = function (target, values, newtarget) {
  Reflect.construct(Boolean, [], target);
  Reflect.construct(Boolean, [], newtarget);
  return this.__handler__.construct(this.__target__, values, newtarget);
};

//////////////
// Property //
//////////////
// https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-defineownproperty-p-desc
// A property cannot be added, if the target object is not extensible.
// A property cannot be added as or modified to be non-configurable, if it does not exists as a non-configurable own property of the target object.
// A property may not be non-configurable, if a corresponding configurable property of the target object exists.
// If a property has a corresponding target object property then Object.defineProperty(target, prop, descriptor) will not throw an exception.
// In strict mode, a false return value from the defineProperty handler will throw a TypeError exception.
handler.defineProperty = function (target, key, descriptor_argument) {
  const descriptor = Reflect_getOwnPropertyDescriptor(target, key);
  if (!descriptor && !Reflect_isExtensible(target))
    return false;
  if (descriptor && !descriptor.configurable) {
    if (descriptor_argument.configurable)
      return false;
    if (descriptor.enumerable && !descriptor_argument.enumerable)
      return false;
    if (!descriptor.enumerable && descriptor_argument.enumerable)
      return false;
    if (Reflect_getOwnPropertyDescriptor(descriptor_argument, "value") || Reflect_getOwnPropertyDescriptor(descriptor_argument, "writable")) {
      if (Reflect_getOwnPropertyDescriptor(descriptor, "get"))
        return false;
      if (!descriptor.writable && descriptor.writable)
        return false;
      if (!descriptor.writable && Reflect_getOwnPropertyDescriptor(descriptor_argument, "value") && descriptor.value !== descriptor_argument.value)
        return false;
    } else {
      if (Reflect_getOwnPropertyDescriptor(descriptor, "value"))
        return false;
      if (Reflect_getOwnPropertyDescriptor(descriptor_argument, "get") && descriptor.get !== descriptor_argument.get)
        return false;
      if (Reflect_getOwnPropertyDescriptor(descriptor_argument, "set") && descriptor.set !== descriptor_argument.set)
        return false;
    }
  }
  if (!descriptor_argument.configurable)
    Reflect_defineProperty(target, key, descriptor_argument);
  return this.__handler__.defineProperty(this.__target__, key, descriptor_argument);
};
// [RELEGATED] getOwnPropertyDescriptor must return an object or undefined.
// A property cannot be reported as non-existent, if it exists as a non-configurable own property of the target object.
// A property cannot be reported as non-existent, if it exists as an own property of the target object and the target object is not extensible.
// A property cannot be reported as existent, if it does not exists as an own property of the target object and the target object is not extensible.
// A property cannot be reported as non-configurable, if it does not exists as an own property of the target object or if it exists as a configurable own property of the target object.
// The result of Object.getOwnPropertyDescriptor(target) can be applied to the target object using Object.defineProperty and will not throw an exception.
handler.getOwnPropertyDescriptor = function (target, key) {
  const descriptor = Reflect_getOwnPropertyDescriptor(target, key);
  if (descriptor && !descriptor.configurable && !descriptor.writable)
    return descriptor;
  const __descriptor__ = this.__handler__.getOwnPropertyDescriptor(this.__target__, key);
  if (__descriptor__ && !__descriptor__.configurable)
    Reflect_defineProperty(target, key, __descriptor__);
  if (!__descriptor__ && descriptor && !Reflect_isExtensible(target))
    Reflect_deleteProperty(target, key);
  return __descriptor__;
};
// A property cannot be deleted, if it exists as a non-configurable own property of the target object.
handler.deleteProperty = function (target, key) {
  const descriptor = Reflect_getOwnPropertyDescriptor(target, key);
  if (descriptor && !descriptor.configurable)
    return false;
  return this.__handler__.deleteProperty(this.__target__, key);
};
// [RELEGATED] The result of ownKeys must be an array.
// [RELEGATED] The type of each array element is either a String or a Symbol.
// The result List must contain the keys of all non-configurable own properties of the target object.
// If the target object is not extensible, then the result List must contain all the keys of the own properties of the target object and no other values.
handler.ownKeys = function (target) {
  if (Reflect_isExtensible(target))
    return this.__handler__.ownKeys(this.__target__);
  const keys = Reflect_ownKeys(target);
  const __keys__ = this.__handler__.ownKeys(this.__target__);
  for (let index = 0, length = keys.length; index < length; index++) {
    if (!__keys__.includes(keys[index])) {
      Reflect_deleteProperty(target, keys[index]);
    }
  }
  return __keys__;
};

////////////////
// Extensible //
////////////////
// isExtensible >> Object.isExtensible(proxy) must return the same value as Object.isExtensible(target).
// preventExtensions >> Object.preventExtensions(proxy) only returns true if Object.isExtensible(proxy) is false.
// getPrototypeOf >> If target is not extensible, Object.getPrototypeOf(proxy) method must return the same value as Object.getPrototypeOf(target).
// ownKeys >> If the target object is not extensible, then the result List must contain all the keys of the own properties of the target object and no other values.
// getOwnPropertyDescriptor >> A property cannot be reported as existent, if it does not exists as an own property of the target object and the target object is not extensible.
handler.preventExtensionsHelper = function (target) {
  const keys = this.__handler__.ownKeys(this.__target__);
  for (let index = 0, length = keys.length; index < length; index++) {
    if (!Reflect_getOwnPropertyDescriptor(target, keys[index])) {
      Reflect_defineProperty(target, keys[index], {value:null, configurable:true});
    }
  }
  Reflect_setPrototypeOf(target, this.__handler__.getPrototypeOf(this.__target__));
  Reflect_preventExtensions(target);
};
// Object.isExtensible(proxy) must return the same value as Object.isExtensible(target).
handler.isExtensible = function (target) {
  if (Reflect_isExtensible(target)) {
    if (this.__handler__.isExtensible(this.__target__))
      return true;
    this.preventExtensionsHelper(target);
    return false;
  }
  return false;
};
// Object.preventExtensions(proxy) only returns true if Object.isExtensible(proxy) is false.
handler.preventExtensions = function (target) {
  if (Reflect_isExtensible(target)) {
    this.__handler__.preventExtensions(this.__target__);
    this.preventExtensionsHelper(target);
  }
  return true;
};

///////////////
// Prototype //
///////////////
// [RELEGATED] getPrototypeOf method must return an object or null. >> 
// If target is not extensible, Object.getPrototypeOf(proxy) method must return the same value as Object.getPrototypeOf(target).
handler.getPrototypeOf = function (target) {
  if (Reflect_isExtensible)
    return this.__handler__.getPrototypeOf(this.__target__);
  return Reflect_getPrototypeOf(target);
};
// If target is not extensible, the prototype parameter must be the same value as Object.getPrototypeOf(target).
handler.setPrototypeOf = function (target, prototype) {
  if (Reflect_isExtensible(target))
    return this.__handler__.setPrototypeOf(this.__target__, prototype);
  return Reflect_getPrototypeOf(target) === prototype;
};

//////////////////////
// Property-Derived //
//////////////////////
// A property cannot be reported as non-existent, if it exists as a non-configurable own property of the target object.
// A property cannot be reported as non-existent, if it exists as an own property of the target object and the target object is not extensible.
handler.has = function (target, key) {
  const descriptor = Reflect_getOwnPropertyDescriptor(target, key);
  if (descriptor && !descriptor.configurable)
    return true;
  if (this.__handler__.getOwnPropertyDescriptor(this.__target__, key))
    return true;
  const prototype = Reflect_isExtensible(target) ? this.__handler__.getPrototypeOf(this.__target__) : Reflect_getPrototypeOf(target);
  const result = Boolean(prototype) && Reflect_has(prototype, key);
  if (!result && descriptor && !Reflect_isExtensible(target))
    Reflect_deleteProperty(target, key);
  return result;
};
// The value reported for a property must be the same as the value of the corresponding target object property if the target object property is a non-writable, non-configurable data property.
// The value reported for a property must be undefined if the corresponding target object property is non-configurable accessor property that has undefined as its [[Get]] attribute.
handler.get = function (target, key, receiver) {
  const descriptor = Reflect_getOwnPropertyDescriptor(target, key);
  if (descriptor && !descriptor.configurable) {
    if (Reflect_getOwnPropertyDescriptor(descriptor, "value")) {
      if (!descriptor.writable) {
        return descriptor.value;
      }
    } else {
      if (descriptor.get) {
        return Reflect_apply(descriptor.get, receiver, []);
      }
      return void 0;
    }
  }
  const __descriptor__ = this.__handler__.getOwnPropertyDescriptor(this.__target__, key);
  if (__descriptor__) {
    if (Reflect_getOwnPropertyDescriptor(__descriptor__, "value")) {
      return __descriptor__.value;
    } else {
      if (__descriptor__.get) {
        return Reflect_apply(__descriptor__.get, receiver, []);
      }
      return void 0;
    }
  }
  const prototype = Reflect_isExtensible(target) ? this.__handler__.getPrototypeOf(this.__target__) : Reflect_getPrototypeOf(target);
  if (prototype)
    return Reflect_get(prototype, key, receiver);
  return void 0;
};
// https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-set-p-v-receiver
// Cannot change the value of a property to be different from the value of the corresponding target object property if the corresponding target object property is a non-writable, non-configurable data property.
// Cannot set the value of a property if the corresponding target object property is a non-configurable accessor property that has undefined as its [[Set]] attribute.
// In strict mode, a false return value from the set handler will throw a TypeError exception.
handler.set = function (target, key, value, receiver) {
  const descriptor = Reflect_getOwnPropertyDescriptor(target, key);
  if (descriptor && !descriptor.configurable) {
    if (Reflect_getOwnPropertyDescriptor(descriptor, "value")) {
      if (!descriptor.writable) {
        return false;
      }
    } else {
      if (descriptor.set) {
        Reflect_apply(descriptor.set, receiver, [value]);
        return true;
      }
      return false;
    }
  }
  let __descriptor__ = this.__handler__.getOwnPropertyDescriptor(this.__target__, key);
  if (!__descriptor__) {
    const prototype = Reflect_isExtensible(target) ? this.__handler__.getPrototypeOf(this.__target__) : Reflect_getPrototypeOf(target);
    if (prototype)
      return Reflect_set(prototype, key, value, receiver);
    __descriptor__ = {value:void 0, writable:true, enumerable:true, configurable:true};
  };
  if (Reflect_getOwnPropertyDescriptor(__descriptor__, "value")) {
    if (!__descriptor__.writable)
      return false;
    if (receiver === null || (typeof receiver !== "object" && typeof receiver !== "function"))
      return false;
    const receiver_descriptor = Reflect_getOwnPropertyDescriptor(receiver, key) || {value:void 0, writable:true, enumerable:true, configurable:true};
    if (!Reflect_getOwnPropertyDescriptor(receiver_descriptor, "value"))
      return false;
    if (!receiver_descriptor.writable)
      return false;
    Reflect_setPrototypeOf(receiver_descriptor, null);
    receiver_descriptor.value = value;
    Reflect_defineProperty(receiver, key, receiver_descriptor);
    return true;
  } else {
    if (__descriptor__.set) {
      Reflect_apply(__descriptor__.set, receiver, [value]);
      return true;
    }
    return false;
  }
}

module.exports = (target, __target__, __handler__) => {

  if (__handler__ === void 0) {
    __handler__ = __target__;
    __target__ = target;
    if (Array.isArray(__target__)) {
      target = [];
    } else if (typeof __target__ === "function") {
      try {
        Reflect_construct(Boolean, [], __target__);
        target = function () { "use strict" };
      } catch (error) {
        target = () => {};
      }
    } else {
      target = {};
    }
  }
  
  return new Proxy(target, {__proto__: handler, __target__, __handler__});

};

module.exports.Array = (__target__, __handler__) => module.exports([], __target__, __handler__);

module.exports.Object = (__target__, __handler__) => module.exports({}, __target__, __handler__);

module.exports.StrictFunction = (__target__, __handler__) => module.exports(function () { "use strict"; }, __target__, __handler__);

module.exports.Function = (__target__, __handler__) => module.exports(function () {}, __target__, __handler__);

module.exports.Arrow = (__target__, __handler__) => module.exports(() => {}, __target__, __handler__);

module.exports.StrictArrow = (__target__, __handler__) => module.exports(() => { "use strict"; }, __target__, __handler__);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],14:[function(require,module,exports){

const Melf = require("melf");
const MelfShare = require("../lib/main.js");
const Primitives = require("./primitives.js");

module.exports = (address) => {
  let counter = 0;
  const assert = (check) => {
    if (!check)
      throw new Error("Assertion failure");
    counter++;
  };
  Melf(address, "bob", (error, melf) => {
    if (error)
      throw error;
    melf.catch((error) => { throw error });
    const done = (message) => {
      console.log(message);
      melf.rpcall("alice", "terminate", null);
      melf.terminate();
    };
    const main = async () => {
      share1 = MelfShare(melf, {synchronous:true, namespace:"sync"});
      share2 = MelfShare(melf, {synchronous:false, namespace:"async"});
      // We use async contruct to have the same communication between sync and async
      const isconstructor1 = (value) => {
        try {
          share1.reflect.construct(Boolean, [], value);
          return true;
        } catch (error) {
          return false;
        }
      };
      const isconstructor2 = async (value) => {
        try {
          await share2.reflect.construct(Boolean, [], value);
          return true;
        } catch (error) {
          return false;
        }
      };
      const get = (name) => {
        const array = melf.rpcall("alice", name, null);
        return [
          share1.instantiate(array[0]),
          share2.instantiate(array[1])
        ];
      };
      // Non Symbolic Primitives
      {
        Object.keys(Primitives).forEach((key) => {
          const [primitive1, primitive2] = get(key);
          assert(Object.is(Primitives[key], primitive1));
          assert(Object.is(Primitives[key], primitive2));
        });
      }
      // Global Symbol
      {
        const [symbol_global_foo1, symbol_global_foo2] = get("symbol_global_foo");
        assert(typeof symbol_global_foo1 === "symbol");
        assert(typeof symbol_global_foo2 === "symbol");
        assert(String(symbol_global_foo1 === "Symbol(foo)"));
        assert(String(symbol_global_foo2 === "Symbol(foo)"));
        assert(symbol_global_foo1 === Symbol.for("foo"));
        assert(symbol_global_foo2 === Symbol.for("foo"));
      }
      // Wellknown Symbol
      {
        const [symbol_wellknown_iterator1, symbol_wellknown_iterator2] = get("symbol_wellknown_iterator");
        assert(typeof symbol_wellknown_iterator1 === "symbol");
        assert(typeof symbol_wellknown_iterator2 === "symbol");
        assert(String(symbol_wellknown_iterator1 === "Symbol(Symbol.iterator)"));
        assert(String(symbol_wellknown_iterator2 === "Symbol(Symbol.iterator)"));
        assert(symbol_wellknown_iterator1 === Symbol.iterator);
        assert(symbol_wellknown_iterator2 === Symbol.iterator);
      }
      // Other Symbol
      {
        const [symbol_foo1, symbol_foo2] = get("symbol_foo");
        assert(typeof symbol_foo1 === "symbol");
        assert(typeof symbol_foo2 === "symbol");
        assert(String(symbol_foo1 === "Symbol(foo)"));
        assert(String(symbol_foo2 === "Symbol(foo)"));
        const [symbol_foo3, symbol_foo4] = get("symbol_foo");
        assert(symbol_foo1 === symbol_foo3);
        assert(symbol_foo2 === symbol_foo4);
      }
      // Array
      {
        const [array1, array2] = get("array");
        assert(Array.isArray(array1));
        assert(Array.isArray(array2));
      }
      // Arrow
      {
        const [arrow_identity1, arrow_identity2] = get("arrow_identity");
        assert(typeof arrow_identity1 === "function");
        assert(typeof arrow_identity2 === "function");
        assert(!       isconstructor1(arrow_identity1));
        assert(! await isconstructor2(arrow_identity2));
        assert(      share1.reflect.apply(arrow_identity1, null, ["foobar"]) === "foobar");
        assert(await share2.reflect.apply(arrow_identity2, null, ["foobar"]) === "foobar");
      }
      // Function
      {
        const [function_this1, function_this2] = get("function_this");
        assert(typeof function_this1 === "function");
        assert(typeof function_this2 === "function");
        assert(      isconstructor1(function_this1));
        assert(await isconstructor2(function_this2));
        const [global1, global2] = get("global");
        assert(      share1.reflect.apply(function_this1, null, []) === global1);
        assert(await share2.reflect.apply(function_this2, null, []) === global2);
        const constructor = function () {};
        assert(      share1.reflect.getPrototypeOf(share1.reflect.construct(function_this1, [], constructor)) === constructor.prototype);
        assert(await share2.reflect.getPrototypeOf(await share2.reflect.construct(function_this2, [], constructor)) === constructor.prototype);
      }
      // Function Strict
      {
        const [strict_function_this1, strict_function_this2] = get("strict_function_this");
        assert(typeof strict_function_this1 === "function");
        assert(typeof strict_function_this2 === "function");
        assert(      isconstructor1(strict_function_this1));
        assert(await isconstructor2(strict_function_this2));
        assert(      share1.reflect.apply(strict_function_this1, "foobar", []) === "foobar");
        assert(await share2.reflect.apply(strict_function_this2, "foobar", []) === "foobar");
      }
      // Object
      {
        const [object1, object2] = get("object");
        assert(typeof object1 === "object");
        assert(typeof object2 === "object");
        assert(typeof object1 !== null);
        assert(typeof object2 !== null);
        const prototype = {__proto__:null};
        assert(      share1.reflect.setPrototypeOf(object1, prototype) === true);
        assert(await share2.reflect.setPrototypeOf(object2, prototype) === true);
        assert(      share1.reflect.getPrototypeOf(object1) === prototype);
        assert(await share2.reflect.getPrototypeOf(object2) === prototype);
        assert(      share1.reflect.defineProperty(object1, "foo", {__proto__:null, value:123}) === true);
        assert(await share2.reflect.defineProperty(object2, "foo", {__proto__:null, value:123}) === true);
        assert((      share1.reflect.getOwnPropertyDescriptor(object1, "foo")).value === 123);
        assert((await share2.reflect.getOwnPropertyDescriptor(object2, "foo")).value === 123);
        assert(      share1.reflect.set(object1, "bar", 123, object1) === true)
        assert(await share2.reflect.set(object2, "bar", 123, object2) === true);
        assert(      share1.reflect.get(object1, "bar", object1) === 123);
        assert(await share2.reflect.get(object2, "bar", object2) === 123);
        assert(      share1.reflect.has(object1, "bar") === true);
        assert(await share2.reflect.has(object2, "bar") === true);
        assert(      share1.reflect.preventExtensions(object1) === true);
        assert(await share2.reflect.preventExtensions(object2) === true);
        assert(      share1.reflect.isExtensible(object1) === false);
        assert(await share2.reflect.isExtensible(object2) === false);
      }
      // toPrimitive
      {
        const object = {foo:123};
        const [object_symbol_primitive_foo1, object_symbol_primitive_foo2] = get("object_symbol_primitive_foo");
        assert(      share1.reflect.get(object, object_symbol_primitive_foo1) === 123);
        assert(await share2.reflect.get(object, object_symbol_primitive_foo2) === 123);
        const [object_toString_foo1, object_toString_foo2] = get("object_toString_foo");
        assert(      share1.reflect.get(object, object_toString_foo1) === 123);
        assert(await share2.reflect.get(object, object_toString_foo2) === 123);
      }
      // toPropertyDescriptor
      {
        const object1 = {__proto__:null};
        const object2 = {__proto__:null};
        const [data_descriptor1, data_descriptor2] = get("data_descriptor");
        assert(      share1.reflect.defineProperty(object1, "foo", data_descriptor1));
        assert(await share2.reflect.defineProperty(object2, "foo", data_descriptor2));
        assert(Reflect.getOwnPropertyDescriptor(object1, "foo").value === 123);
        assert(Reflect.getOwnPropertyDescriptor(object2, "foo").value === 123);
        assert(Reflect.getOwnPropertyDescriptor(object1, "foo").writable === true);
        assert(Reflect.getOwnPropertyDescriptor(object2, "foo").writable === true);
        assert(Reflect.getOwnPropertyDescriptor(object1, "foo").enumerable === true);
        assert(Reflect.getOwnPropertyDescriptor(object2, "foo").enumerable === true);
        assert(Reflect.getOwnPropertyDescriptor(object1, "foo").configurable === true);
        assert(Reflect.getOwnPropertyDescriptor(object2, "foo").configurable === true);
        const [accessor_descriptor1, accessor_descriptor2] = get("accessor_descriptor");
        assert(      share1.reflect.defineProperty(object1, "foo", accessor_descriptor1));
        assert(await share2.reflect.defineProperty(object2, "foo", accessor_descriptor2));
        assert(      share1.reflect.get(accessor_descriptor1, "get") ===  Reflect.getOwnPropertyDescriptor(object1, "foo").get);
        assert(await share2.reflect.get(accessor_descriptor2, "get") ===  Reflect.getOwnPropertyDescriptor(object2, "foo").get);
        assert(      share1.reflect.get(accessor_descriptor1, "set") ===  Reflect.getOwnPropertyDescriptor(object1, "foo").set);
        assert(await share2.reflect.get(accessor_descriptor2, "set") ===  Reflect.getOwnPropertyDescriptor(object2, "foo").set);
        assert(Reflect.getOwnPropertyDescriptor(object1, "foo").enumerable === true);
        assert(Reflect.getOwnPropertyDescriptor(object2, "foo").enumerable === true);
        assert(Reflect.getOwnPropertyDescriptor(object1, "foo").configurable === true);
        assert(Reflect.getOwnPropertyDescriptor(object2, "foo").configurable === true);
      }
      // Unary
      {
        const [object_valueOf_123_1, object_valueOf_123_2] = get("object_valueOf_123");
        assert(      share1.reflect.unary("-", object_valueOf_123_1) === -123);
        assert(await share2.reflect.unary("-", object_valueOf_123_2) === -123);
      }
      // ==
      {
        const [object_symbol_primitive_foo1, object_symbol_primitive_foo2] = get("object_symbol_primitive_foo");
        assert(      share1.reflect.binary("==", object_symbol_primitive_foo1, "foo") === true);
        assert(await share2.reflect.binary("==", object_symbol_primitive_foo2, "foo") === true);
      }
      // Binary
      {
        const [object_valueOf_123_1, object_valueOf_123_2] = get("object_valueOf_123");
        assert(      share1.reflect.binary("+", object_valueOf_123_1, 1) === 124);
        assert(await share2.reflect.binary("+", object_valueOf_123_2, 1) === 124);
      }
      // Return
      return counter;
    };
    main().then((counter) => {
      done(counter+" assertions passed");
    }, (reason) => {
      done(String(reason))
    });
  });
};

},{"../lib/main.js":2,"./primitives.js":16,"melf":12}],15:[function(require,module,exports){
require("../bob.js")("__melf_share_traffic__");
},{"../bob.js":14}],16:[function(require,module,exports){
module.exports = {
  null: null,
  nan: 0/0,
  negative_infinity: -1/0,
  positive_infinity: 1/0,
  negative_zero: -1,
  undefined: void 0,
  string_foo: "foo",
  number_123: 123,
  true: true,
  false: false
};
},{}],17:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[15]);
