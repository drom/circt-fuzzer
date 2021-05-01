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
      --version     Show version number                                [boolean]
  -v, --verbose                                         [count] [default: false]
  -s, --seed                                                            [number]
  -O, --max-ops                                          [number] [default: 100]
  -I, --max-inputs                                       [number] [default: 100]
  -z, --zero-width                                     [boolean] [default: true]
  -m, --max-width                                        [number] [default: 250]
  -L, --literals                                       [boolean] [default: true]
  -o, --output                                                          [string]
  -n, --node-count                                    [boolean] [default: false]
      --verif                                          [boolean] [default: true]
      --fsms                                           [boolean] [default: true]
      --bundles                                        [boolean] [default: true]
      --vectors                                        [boolean] [default: true]
      --instances                                      [boolean] [default: true]
      --mems                                           [boolean] [default: true]
      --ordered                                       [boolean] [default: false]
      --help        Show help                                          [boolean]
```
