# MelfShare <img src="kalah.png" align="right" alt="kalah-logo" title="Kalah, the Gnome Illusionist"/>

(A)Synchronous remote references based on [melf](https://www.npmjs.com/package/melf).

## `{serialize, instantiate, reflect, ownerof, discard} = require("melf-share")(melf, {synchronous, namespace})`

* `melf :: melf.Melf`
* `synchronous :: boolean | undefined`
* `namespace :: string | undefined`
* `data = serialize(value, hint)`
  * `value :: *`
  * `hint :: Hint`
  * `data :: JSON`
* `value = instantiate(data)`
  * `data :: JSON`
  * `value :: *`
* `reflect :: object`
* `alias = ownerof(value)`
  * `value :: object | symbol`
  * `alias :: string`
* `success = discard(value)`
  * `value :: object | symbol`
  * `success :: boolean`

## Hints

* `"number"`, `"string"` or `"default"`:
  Will try to transform the given value into a primitive using the [standard steps](https://www.ecma-international.org/ecma-262/9.0/index.html#sec-toprimitive).
* Array of hint:
  Will try to serialize the elements of the given value using the elements of the hint.
  The instantiation will result to a new local array if successful else a remote array.
* Object of hint:
  Will try to serialize the enumerable properties of the given value using the properties of the hint.
  The instantiation will result to a new local object if successful else a remote object.
* Others:
  Others hint values are ignored and can be used for documentation purpose.
  After instantiation:
  * Non-symbolic primitives will refer to the same value (`undefined`, `NaN`, `+Infinity`, `-Infinity`, `-0` are supported).
  * [Well-known and global symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) will refer the local corresponding well-known/global symbol.
  * Other symbols will refer to a dedicated symbol with the same string representation.
  * Arrays will refer to a remote array.
  * Non-constructors will refer to a remote arrow.
  * Constructors will refer to a remote function.
  * Objects will refer to a remote object.
