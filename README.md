# kalah <img src="kalah.png" align="right" alt="kalah-logo" title="Kalah, the Gnome Illusionist"/>

(A)Synchronous remote references based on [melf](https://www.npmjs.com/package/melf).
Usage [here](/demo), live demo [here](https://cdn.rawgit.com/lachrist/kalah/1d4515d9/demo/index.html).

## `sharing = require("melf-sharing")(melf, synchronous)`

* `melf :: melf.Melf`
* `synchronous :: boolean`
* `sharing :: object`
  * `alias = sharing.ownerof(value)`
    * `value :: *`
    * `alias :: string`
  * `json = sharing.serialize(value, hint)`
    * `value :: *`
    * `hint :: Hint`
    * `json :: JSON`
  * `value = sharing.instantiate(json)`
    * `json :: JSON`
    * `value :: *`

## `require("melf-sharing").rest`

A symbol indicating the hint that should be used for the rest of the properties of an object or an array.

## Hints

- "*"


Hint          | Succeed when true                                                              | Convertion                        | Mistmatch             | arguments[2]        | arguments[3]
--------------|--------------------------------------------------------------------------------|-----------------------|---------------------|-----------------
**Atomic**    |                                                                                |                         |                     |
"null"        | `value === null`                                                               | 
"undefined"   | `value === undefined`                                                          | `undefined`
"boolean"     | `typeof value === "boolean"`                                                   | a boolean
"booleanize"  | `typeof Boolean(value) === "boolean"`                                          | a boolean
"number"      | `typeof value === "number"`                                                    | a number
"numberify"   | `typeof Number(value) === "number"`                                            | a number
"string"      | `typeof value === "string"`                                                    | a string
"stringify"   | `typeof String(value) === "string`                                             | a string
"json"        | `(JSON.stringify(value), true)`                                                | a JSON data                               |
"symbol"      | `typeof value === "symbol`                                                     | a symbol   
"primitive"   | `value === null || (typeof value !== "object" && typeof value !== "function")` | A copy of the primitive value
"reference"   | `value !== null && (typeof value === "object" || typeof value === "function")` | A far reference
"array"       | `Array.isArray(value)`                                                         | A far reference
"function"    | `typeof value === "function"`                                                  | A far reference
**Compound**
["either"]
| `for (let key in )`


=======
Atomic 

Atomic hints are strings:
* `"null"`: pass-by-value the `null` value, throws if not `null`.
* `"undefined"`: pass-by-value the `undefined` value, throws if not `undefined`.
* `"boolean"`: pass-by-value a boolean value, throws if not a boolean.
* `"booleanify"`: pass-by-value a boolean, convert first if not a boolean.
* `"number"`: pass-by-value a number (including `NaN`, `Infinity`, `-Infinity` and `-0`), throws if not a number.
* `"numberify"`: pass-by-value a number (including `NaN`, `Infinity`, `-Infinity` and `-0`), convert first if not a number.
* `"string"`: seripass-by-valuealize a string, throws if not a string.
* `"stringify"`: pass-by-value a string, convert first if not a string.
* `"json"`: pass-by-value a JSON-stringify-able structure.
// * `"well-known-symbol"`: pass-by-value a [well-known symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol), throws if not a well-known symbol. 
// * `"symbol"`: pass-by-value [well-known symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) pass-by-reference a symbol, throws if not a symbol.
* `"primitive"`: pass-by-value a primitive (`null`, `undefined`, boolean, number, string, symbol), throws if not a primitive.

* `"symbol"`: pass a copy

* `"object"`: pass-by-reference an object (including arrays an functions), throws if not an object.
* `"array"`: pass-by-reference an array, throws if not an array.
* `"function"`: pass-by-reference a function, throws if not a function.

* `reference`: pass a remote refernce of a symbol or an object (including ).

* `"*"`: serialize a non-symbolic primitive or serialize a well-known symbol or share a non well-known symbol or share an object.

Compound
* `["either", hint1, hint2, ...]`: use the first hint that doesn't throw, throws if all hints threw.
* `[hint1, hint2, ..., MelfSharing.rest, hint]`: serialize the content of an object as if it is an array, throw if not an object.
* `{key1:hint1, key2:hint2, ..., [MelfSharing.rest]:hint}`: serialize the content of an object, throw if not an object.
