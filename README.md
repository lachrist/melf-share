# kalah <img src="kalah.png" align="right" alt="kalah-logo" title="Kalah, the Gnome Illusionist"/>

(A)Synchronous remote references based on [melf](https://www.npmjs.com/package/melf).
Usage [here](/demo), live demo [here](https://cdn.rawgit.com/lachrist/kalah/1d4515d9/demo/index.html).

## `kalah = require("kalah")(melf, options)`

* `melf :: melf.Melf`
* `options :: object`
  * `sync :: boolean`
  * `namespace :: string`
* `kalah :: object`
  * `alias = ownerof(value)`
    * `value :: *`
    * `alias :: string`
  * `value = import(data, type)`
    * `data :: json`
    * `type :: Type`
    * `value :: *`
  * `data = export(value, type)`
    * `value :: *`
    * `type :: Type`
    * `data :: json`

## Type

* `"boolean"`
* `"number"`
* `"string"`
* `"primitive"`
* `"reference"`
* `"json"`
* `"any"`
* `{Type}`
* `[Type]`
