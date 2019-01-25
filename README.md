# MelfShare <img src="kalah.png" align="right" alt="kalah-logo" title="Kalah, the Gnome Illusionist"/>

(A)Synchronous remote references based on [melf](https://www.npmjs.com/package/melf).

## `{serialize, instantiate, ownerof, discard} = require("melf-share")(melf, {synchronous, namespace})`

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
* `alias = ownerof(value)`
  * `value :: object | symbol`
  * `alias :: string`
* `success = discard(value)`
  * `value :: object | symbol`
  * `success :: boolean`

## Hints

* Primitive:
  Serialise *any* value (the value of the primitive is only for documentation purpose).
  After instantiation:
  * Non-symbolic primitives:
    will refer to the same value (`undefined`, `NaN`, `+Infinity`, `-Infinity`, `-0` are supported).
  * [Well-known and global symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol):
    will refer the local corresponding well-known/global symbol.
  * Other symbols:
    will refer to a dedicated symbol with the same string representation.
  * Objects:
    will refer to a dedicated proxy whose traps forward operations to the serialising process.
* Array of hint:
  The elements of a hint-array are hints which will be used to convert the corresponding element of the given value.
  Instantiation will result to a new local array.
* Object of hint:
  The properties of a hint-object are hints which will be used to convert the corresponding properties of the given value.
  Instantiation will result in a new local object.
