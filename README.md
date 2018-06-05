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

## `require("melf-sharing").default`

A symbol indicating the hint that should be used by default to serialize the properties of an object.

## Hints

* `"*"`: Serialize *any* value.
  After instantiation with a different MelfSharing instance:
  * non-symbolic primitives:
    will refer to the same value (`undefined`, `NaN`, `+Infinity`, `-Infinity`, `-0` are supported).
  * [well-known symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol):
    will refer the local corresponding well-known symbol.
  * other symbols:
    will refer to a dedicated symbol with the same string representation.
  * objects:
    will refer to a dedicated proxy whose traps forward operations to the serializing process.
* `[Hint]`:
  The elements of a hint-array are hints which will be used to convert the corresponding element of the given value.
  If the given value has a longer length than the hint-array, the last hint will be used repeatedly.
  Instantiation will result to a new local array.
* `{Hint}`:
  The properties of a hint-object are hints which will be used to convert the corresponding properties of the given value.
  `require("melf-sharing").default` can be used to set the default hint to use.
  Instantiation will result in a new local object.
