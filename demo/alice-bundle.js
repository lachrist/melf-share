(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
const Emitter = require("antena/emitter/worker");
const Melf = require("melf");
const Kalah = require("../main.js");
Melf({
  emitter: Emitter(),
  alias: "alice",
  key: "key-a"
}, (error, melf) => {
  if (error)
    throw error;
  const akalah = Kalah(melf, {
    sync: false,
    namespace: "foo"
  });
  const skalah = Kalah(melf, {
    sync: true,
    namespace: "bar"
  });
  melf.rprocedures["counter-async"] = (origin, data, callback) => {
    ((async () => {
      const f = akalah.import(data);
      const x = await f("foo");
      const y = await f("bar");
      const z = await f("qux");
      return x+y+z;
    }) ()).then((result) => callback(null, result), callback);
  };
  melf.rprocedures["counter-sync"] = (origin, data, callback) => {
    try {
      const f = skalah.import(data);
      const x = f("foo");
      const y = f("bar");
      const z = f("qux");
      callback(null, x+y+z);
    } catch (error) {
      callback(error);
    }
  };
});
},{"../main.js":12,"antena/emitter/worker":6,"melf":10}],2:[function(require,module,exports){

var Split = require("./method/split.js");
var Trace = require("./method/trace.js");
var Fork = require("./method/fork.js");

var prototype = {
  split: Split,
  fork: Fork,
  trace: Trace
};

module.exports = function (request, connect) {
  var emitter = Object.create(prototype);
  emitter.request = request;
  emitter.connect = connect;
  emitter._prefix = "";
  return emitter;
};

},{"./method/fork.js":3,"./method/split.js":4,"./method/trace.js":5}],3:[function(require,module,exports){

module.exports = function (splitter) {
  var emitter = Object.create(Object.getPrototypeOf(this));
  Object.assign(emitter, this);
  emitter._prefix += "/"+splitter;
  return emitter;
};

},{}],4:[function(require,module,exports){

module.exports = function (splitters) {
  var emitters = {};
  for (var i=0; i<splitters.length; i++) {
    emitters[splitters[i]] = Object.create(Object.getPrototypeOf(this));
    Object.assign(emitters[splitters[i]], this);
    emitters[splitters[i]]._prefix += "/"+splitters[i];
  }
  return emitters;
};

},{}],5:[function(require,module,exports){

var SocketLog = require("../../util/socket-log.js");

var rcounter = 0;
var ccounter = 0;

function request (method, path, headers, body, callback) {
  var name = this._name;
  var path = this._prefix+path;
  var id = rcounter++;
  console.log(name+"req#"+id+" "+method+" "+path+" "+JSON.stringify(headers)+" "+body);
  if (!callback) {
    var res = this._emitter.request(method, path, headers, body);
    console.log(name+"res#"+id+" "+res[0]+" "+res[1]+" "+JSON.stringify(res[2])+" "+res[3]);
    return res;
  }
  this._emitter.request(method, path, headers, body, function (error, status, reason, headers, body) {
    console.log(name+"res#"+id+" "+status+" "+reason+" "+JSON.stringify(headers)+" "+body);
    callback(error, status, reason, headers, body);
  });
}

function connect (path) {
  var id = ccounter++;
  console.log(this._name+"con#"+id+" "+this._prefix+path);
  return SocketLog(this._emitter.connect(this._prefix+path), this._name+"con#"+id);
}

module.exports = function (name) {
  var self = Object.create(Object.getPrototypeOf(this));
  self.request = request;
  self.connect = connect;
  self._prefix = "";
  self._emitter = this;
  self._name = name || "";
  return self;
};

},{"../../util/socket-log.js":7}],6:[function(require,module,exports){
(function (global){

var WorkerSocketPool = require("../util/worker-socket-pool.js");
var Factory = require("./factory.js");

function request (method, path, headers, body, callback) {
  method = method || "GET";
  path = path || "";
  headers = headers || {};
  body = body || "";
  var copy = {};
  for (var key in headers)
    copy[key] = ""+headers[key];
  if (!callback) {
    this._views.lock[0] = 1;
    global.postMessage({
      name: "sync",
      method: method,
      path: this._prefix+path,
      headers: copy,
      body: body
    });
    while (this._views.lock[0]);
    if (this._views.length[0] > this._views.data.length)
      return [new Error("Response too long for "+method+" "+path)];
    var data = JSON.parse(String.fromCharCode.apply(null, this._views.data.slice(0, this._views.length[0])));;
    return [null, data.status, data.reason, data.headers, data.body];
  }
  for (var i=0; i<=this._callbacks.length; i++) {
    if (!this._callbacks[i]) {
      this._callbacks[i] = callback;
      return global.postMessage({
        name: "async",
        index: i,
        method: ""+method,
        path: this._prefix+path,
        headers: copy,
        body: body
      });
    }
  }
}

function connect (path) {
  path = path || "";
  var index = this._poolcreate();
  global.postMessage({
    name: "open1",
    path: this._prefix+path,
    pair: index
  });
  return this._poolget(index);
}

var singleton = false;

module.exports = function (size) {
  if (singleton)
    throw new Error("Only one worker emitter can be created...");
  singleton = true;
  var callbacks = [];
  var pool = WorkerSocketPool(global);
  var handlers = {
    close1: pool.onclose1,
    close2: pool.onclose2,
    message: pool.onmessage,
    open2: function (data) { pool.open(data.index, data.pair) },
    async: function (data) {
      callbacks[data.index](null, data.status, data.reason, data.headers, data.body);
      delete callbacks[data.index];
    }
  };
  onmessage = function (message) {
    handlers[message.data.name](message.data)
  };
  var shared = new SharedArrayBuffer(2*(size||1024)+8);
  global.postMessage(shared);
  var views = {};
  views.lock = new Uint8Array(shared, 0, 1);
  views.length = new Uint32Array(shared, 4, 1);
  views.data = new Uint16Array(shared, 8);
  var emitter = Factory(request, connect);
  emitter._callbacks = callbacks;
  emitter._views = views;
  emitter._poolcreate = pool.create;
  emitter._poolget = pool.get;
  return emitter;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../util/worker-socket-pool.js":8,"./factory.js":2}],7:[function(require,module,exports){

var Events = require("events");

module.exports = function (con, name) {
  var wrapper = new Events();
  wrapper.send = function (message) {
    console.log(name+" >> "+message);
    con.send(message);
  };
  wrapper.close = function (code, reason) {
    console.log(name+" close "+code+" "+reason);
    con.close(code, reason);
  };
  con.on("message", function (message) {
    console.log(name+" << "+message);
    wrapper.emit("message", message);
  });
  con.on("close", function (code, reason) {
    console.log(name+" onclose "+code+" "+reason);
    wrapper.emit("close", code, reason);
  });
  con.on("open", function () {
    console.log(name+" onopen");
    wrapper.emit("open");
  });
  con.on("error", function (error) {
    console.log(name+" onerror "+error.message);
    wrapper.emit("error", error);
  });
  return wrapper;
};

},{"events":16}],8:[function(require,module,exports){

var Events = require("events");

module.exports = function (poster) {

  var pool = [];

  function send (message) {
    if (this.readyState !== 1)
      throw new Error("INVALID_STATE_ERR");
    poster.postMessage({
      name: "message",
      index: this._pair,
      message: message instanceof ArrayBuffer ? message : ""+message
    });
  }

  function close (code, reason) {
    if (this.readyState === 0 || this.readyState === 1) {
      this.readyState = 2;
      poster.postMessage({
        name: "close1",
        index: this._pair,
        code: parseInt(code),
        reason: ""+reason
      });
    }
  }

  return {
    create: function () {
      var index = 0;
      while (pool[index])
        index++;
      pool[index] = new Events();
      pool[index].send = send;
      pool[index].close = close;
      pool[index].readyState = 0;
      return index;
    },
    get: function (index) {
      return pool[index];
    },
    open: function (index, pair) {
      pool[index]._pair = pair;
      pool[index].readyState = 1;
      pool[index].emit("open");
    },
    onmessage: function (data) {
      if (pool[data.index].readyState === 1) {
        pool[data.index].emit("message", data.message);
      } else if (pool[data.index].readyState !== 2) {
        throw new Error("Inconsistent state");
      }
    },
    onclose1: function (data) {
      if (pool[data.index].readyState === 3)
        throw new Error("Inconsistent state");
      pool[data.index].readyState = 3;
      pool[data.index].emit("close", data.code, data.reason);
      poster.postMessage({
        name: "close2",
        index: pool[data.index]._pair,
        code: data.code,
        reason: data.reason
      });
      pool[data.index] = null;
    },
    onclose2: function (data) {
      if (pool[data.index].readyState !== 2)
        throw new Error("Inconsistent state");
      pool[data.index].readyState = 3;
      pool[data.index].emit("close", data.code, data.reason);
      pool[data.index] = null;
    }
  };
};

},{"events":16}],9:[function(require,module,exports){

function rcall (recipient, name, data, callback) {
  do {
    var token = Math.random().toString(36).substring(2, 10);
  } while (token in this._callbacks);
  this._callbacks[token] = callback;
  this._send(recipient, {
    token: token,
    name: name,
    data: data
  });
}

function receive (origin, meteor) {
  if ("token" in meteor && "name" in meteor) {
    if (meteor.name in this.rprocedures) {
      const send = this._send;
      this.rprocedures[meteor.name](origin, meteor.data, (error, data) => {
        send(origin, {
          echo: meteor.token,
          error: error,
          data: data
        });
      });
    } else {
      this._send(origin, {
        echo: meteor.token,
        error: new Error("Remote procedure not found: "+meteor.name)
      });
    }
  } else if (meteor.echo in this._callbacks) {
    const callback = this._callbacks[meteor.echo];
    delete this._callbacks[meteor.echo];
    callback(meteor.error, meteor.data);
  }
}

module.exports = (send) => {
  return {
    _send: send,
    _callbacks: Object.create(null),
    rprocedures: Object.create(null),
    rcall: rcall,
    receive: receive
  };
};

},{}],10:[function(require,module,exports){

const Events = require("events");
const Agent = require("./agent.js");
const MeteorFormat = require("./meteor-format.js");

const max = parseInt("zzzz", 36);

function rcall (recipient, name, data, callback) {
  if (callback)
    return this._rcall(recipient, name, data, callback);
  let pending = true;
  let result = null;
  this._rcall(recipient, name, data, (error, data) => {
    if (error)
      throw error;
    pending = false;
    result = data;
  });
  while (pending) {
    let res = this._emitter.request("GET", this._login+"/"+this._expect.toString(36), {}, null);
    if (res[0] || res[1] !== 200)
      throw res[0] || new Error(res[1]+" ("+res[2]+")");
    if (res[4] !== "") {
      res[4].split("\n").forEach(this._online);
    }
  }
  return result;
}

function close (code, reason) {
  this._con.close(code, reason);
}

module.exports = (options, callback) => {
  const login = "/"+options.alias+"/"+options.key;
  const con = options.emitter.connect(login);
  con.on("error", callback);
  con.on("open", () => {
    con.removeAllListeners("error");
    con.on("message", (message) => {
      const index = message.indexOf("/");
      if (melf._expect === parseInt(message.substring(0, index), 36)) {
        melf._online(message.substring(index+1));
      }
    });
    con.on("error", (error) => {
      melf.emit("error", error);
    });
    con.on("close", (code, reason) => {
      melf.emit("close", code, reason);
    });
    const mformat = MeteorFormat(options.format);
    const melf = new Events();
    Object.assign(melf, Agent((recipient, message) => {
      con.send(recipient+"/"+mformat.stringify(message));
    }));
    melf._receive = melf.receive;
    melf._rcall = melf.rcall;
    melf._expect = 0;
    melf._con = con;
    melf._emitter = options.emitter;
    melf._login = login;
    melf._online = (line) => {
      melf._expect++;
      if (melf._expect > max)
        melf._expect = 0;
      const index = line.indexOf("/");
      melf._receive(line.substring(0, index), mformat.parse(line.substring(index+1)));
    };
    melf.alias = options.alias;
    melf.close = close;
    melf.rcall = rcall;
    delete melf.receive;
    callback(null, melf);
  });
};

},{"./agent.js":9,"./meteor-format.js":11,"events":16}],11:[function(require,module,exports){

// ?token/name/data
// @echo/data
// !echo/error-message
// |echo/error

module.exports = (format) => {
  return {
    _format: format || JSON,
    parse: parse,
    stringify: stringify
  };
};

function parse (string) {
  if (string[0] === "?") {
    const parts = /^([^/]*)\/([^/]*)\/(.*)$/.exec(string.substring(1));
    if (parts) {
      return {
        token: parts[1],
        name: parts[2],
        data: this._format.parse(parts[3])
      };
    }
  }
  const parts = /^([^/]*)\/(.*)$/.exec(string.substring(1));
  if (parts) {
    if (string[0] === "@") {
      return {
        echo: parts[1],
        data: this._format.parse(parts[2])
      };
    }
    if (string[0] === "!") {
      return {
        echo: parts[1],
        error: new Error(JSON.parse(parts[2]))
      };
    }
    if (string[0] === "|") {
      return {
        echo: parts[1],
        error: this._format.parse(parts[2])
      };
    }
  }
  throw new Error("Cannot parse as meteor: "+string);
};

function stringify (meteor) {
  if ("token" in meteor && "name" in meteor)
    return "?"+meteor.token+"/"+meteor.name+"/"+this._format.stringify(meteor.data);
  if ("echo" in meteor) {
    if (meteor.error instanceof Error)
      return "!"+meteor.echo+"/"+JSON.stringify(meteor.error.message);
    if (meteor.error)
      return "|"+meteor.echo+"/"+this._format.stringify(meteor.error);
    return "@"+meteor.echo+"/"+this._format.stringify(meteor.data);
  }
  throw new Error("Cannot stringify meteor: "+meteor);
};

},{}],12:[function(require,module,exports){

const Reference = require("./reference.js");
const TypeMap = require("./type-map.js");

module.exports = (melf, options) => {
  options = options || {};
  options.sync = options.sync || false;
  options.prefix = options.prefix || "";
  const imp = (value, type) => TypeMap(value, type || "any", importers);
  const exp = (value, type) => TypeMap(value, type || "any", exporters);
  const reference = Reference(melf, imp, exp, options);
  const importers = {
    json: (x) => x,
    reference: reference.import,
    boolean: Boolean,
    number: (x) => {
      if (Array.isArray(x) && x.length === 1) {
        const inner = x[0];
        if (inner === "undefined")
          return void 0;
        if (inner === "NaN")
          return 0/0;
        if (inner === "-Infinity")
          return -1/0;
        if (inner === "Infinity")
          return 1/0;
      }
      return Number(x);
    },
    string: String,
    primitive: (x) => {
      if (typeof x === "number" || typeof x === "string" || x === null)
        return x;
      if (Array.isArray(x) && x.length === 1) {
        const inner = x[0];
        if (inner === "undefined")
          return void 0;
        if (inner === "NaN")
          return 0/0;
        if (inner === "-Infinity")
          return -1/0;
        if (inner === "Infinity")
          return 1/0;
      }
      throw new Error("Cannot import as primitive: "+x);
    },
    any: (x) => {
      if (typeof x === "number" || typeof x === "string" || x === null)
        return x;
      if (Array.isArray(x) && x.length === 1) {
        const inner = x[0];
        if (inner === "undefined")
          return void 0;
        if (inner === "NaN")
          return 0/0;
        if (inner === "-Infinity")
          return -1/0;
        if (inner === "Infinity")
          return 1/0;
        return reference.import(inner);
      }
      throw new Error("Cannot import: "+x);
    }
  };
  const exporters = {
    json: (x) => x,
    reference: reference.export,
    boolean: Boolean,
    number: (x) => {
      x = Number(x);
      if (x !== x)
        return ["NaN"];
      if (x === -1/0)
        return ["-Infinity"];
      if (x === 1/0)
        return ["Infinity"];
      return x;
    },
    string: String,
    primitive: (x) => {
      if (typeof x === "symbol")
        throw new Error("Cannot exports symbols: "+x);
      if (x === void 0)
        return ["undefined"];
      if (x !== x)
        return ["NaN"];
      if (x === -1/0)
        return ["-Infinity"];
      if (x === 1/0)
        return ["Infinity"];
      if (x === null || typeof x === "number" || typeof x === "string")
        return x;
      throw new Error("Cannot exports as primitive: "+x);
    },
    any: (x) => {
      if (typeof x === "symbol")
        throw new Error("Cannot exports symbols: "+x);
      if (x === void 0)
        return ["undefined"];
      if (x !== x)
        return ["NaN"];
      if (x === -1/0)
        return ["-Infinity"];
      if (x === 1/0)
        return ["Infinity"];
      if (x === null || typeof x === "number" || typeof x === "string")
        return x;
      return [exporters.reference(x)];
    }
  };
  return {
    import: imp,
    export: exp,
    ownerof: reference.ownerof
  };
};

},{"./reference.js":13,"./type-map.js":15}],13:[function(require,module,exports){

const ReflectTypes = require("./reflect-types.js");

module.exports = (melf, imp, exp, options) => {
  let counter = 0;
  const traps = {};
  const refs = {};
  Reflect.ownKeys(Reflect).forEach((key) => {
    const name = "kalah-"+options.namespace+key;
    const itype = ReflectTypes[key][0];
    const otype = ReflectTypes[key][1];
    melf.rprocedures[name] = (origin, data, callback) => { 
      try {
        const target = refs[melf.alias+"/"+data.shift()];
        const arguments = imp(data, itype);
        arguments.unshift(target);
        callback(null, exp(Reflect[key].apply(null, arguments), otype));
      } catch (err) {
        callback(err);
      }
    };
    if (options.sync) {
      traps[key] = (target, ...arguments) => {
        const data = exp(arguments, itype);
        data.unshift(target.token);
        return imp(melf.rcall(target.alias, name, data), otype);
      };
    } else {
      traps[key] = (target, ...arguments) => {
        return new Promise((resolve, reject) => {
          const data = exp(arguments, itype);
          data.unshift(target.token);
          melf.rcall(target.alias, name, data, (error, data) => {
            if (error)
              return reject(error);
            resolve(imp(data, otype));
          });
        });
      }
    }
  });
  return {
    ownerof: (ref) => {
      for (let key in refs)
        if (refs[key] === ref)
          return key.split("/")[0];
      return melf.alias;
    },
    import: (key) => {
      if (key in refs)
        return refs[key];
      const parts = key.split("/");
      const target = parts[1][0] === "f" ? (() => {}) : (parts[1][0] === "a" ? [] : {});
      target.alias = parts[0];
      target.token = parts[1];
      return refs[key] = new Proxy(target, traps);
    },
    export: (ref) => {
      for (let key in refs)
        if (refs[key] === ref)
          return key;
      const type = typeof ref === "function" ? "f" : (Array.isArray(ref) ? "a" : "o");
      const key = melf.alias+"/"+type+(++counter).toString(36);
      refs[key] = ref;
      return key;
    }
  };
};

},{"./reflect-types.js":14}],14:[function(require,module,exports){

const descriptor = {
  configurable: "boolean",
  enumerable: "boolean",
  writable: "boolean",
  value: "any",
  get: "any",
  set: "any"
};

exports.getPrototypeOf = [[], "any"];
exports.setPrototypeOf = [["any"], "boolean"];
exports.isExtensible = [[], "boolean"];
exports.preventExtensions = [[], "boolean"];
exports.getOwnPropertyDescriptor = [["string"], descriptor];
exports.defineProperty = [["string", descriptor], "boolean"];
exports.has = [["string"], "boolean"];
exports.get = [["string", "any"], "any"];
exports.set = [["string", "any", "any"], "boolean"];
exports.deleteProperty = [["string"], "boolean"];
exports.ownKeys = [[], ["string"]];
exports.apply = [["any", ["any"]], "any"];
exports.construct = [["any"], "any"];

},{}],15:[function(require,module,exports){

const loop = (value, type, mappers) => {
  if (typeof type === "string" && type in mappers)
    return mappers[type](value);
  if (Array.isArray(type)) {
    const xs = [];
    const last = type[type.length-1]
    for (let i=0; i<value.length; i++)
      xs[i] = loop(value[i], type[i] || last, mappers);
    return xs;
  }
  if (typeof type === "object" && type !== null) {
    const o = {};
    for (let k in type) {
      if (k in value) {
        o[k] = loop(value[k], type[k], mappers);
      }
    }
    return o;
  }
  throw new Error("Unrecognized type: "+type);
};

module.exports = loop;

},{}],16:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

EventEmitter.prototype.listeners = function listeners(type) {
  var evlistener;
  var ret;
  var events = this._events;

  if (!events)
    ret = [];
  else {
    evlistener = events[type];
    if (!evlistener)
      ret = [];
    else if (typeof evlistener === 'function')
      ret = [evlistener.listener || evlistener];
    else
      ret = unwrapListeners(evlistener);
  }

  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}]},{},[1]);
