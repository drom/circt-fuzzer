[![NPM version](https://img.shields.io/npm/v/circt-fuzzer.svg)](https://www.npmjs.org/package/circt-fuzzer)
[![Status](https://github.com/drom/circt-fuzzer/workflows/Tests/badge.svg)](https://github.com/drom/circt-fuzzer/actions)

Generator of random circuits

### Install

```js
npm i circt-fuzzer
```

### Usage

```js
circt-fuzzer --help
```

```bash
Commands:
  cli.js fir  generate FIRRTL circuit                          [aliases: firrtl]

Options:
      --version      Show version number                               [boolean]
  -o, --output       output file name                                   [string]
  -s, --seed         seed for pseudo-random generator                   [number]
  -v, --verbose      verbosity level                    [count] [default: false]
  -O, --max-ops      max number of opearations           [number] [default: 100]
  -I, --max-inputs   max number of inputs                [number] [default: 100]
  -z, --zero-width   width of some values -> 0         [boolean] [default: true]
  -m, --max-width    Max width of values                 [number] [default: 250]
  -L, --literals     make literals                     [boolean] [default: true]
  -n, --node-count   print out number of nodes        [boolean] [default: false]
      --verif        assert, assume, cover             [boolean] [default: true]
      --fsms         Finite State Machines             [boolean] [default: true]
      --bundles      bundles                           [boolean] [default: true]
      --vectors      vectors                           [boolean] [default: true]
      --instances    instances                         [boolean] [default: true]
      --mems         memories                          [boolean] [default: true]
      --ordered      expressions in SSA order          [boolean] [default: true]
      --unsized-lit  some unsized nodes                [boolean] [default: true]
      --help         Show help                                         [boolean]
```
