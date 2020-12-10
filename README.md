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
circt-fuzzer <command>

Commands:
  circt-fuzzer fir  generate FIRRTL circuit                          [aliases: firrtl]

Options:
  --version         Show version number                                [boolean]
  --verbose, -v                                         [count] [default: false]
  --seed, -s                                                            [number]
  --max-ops, -O                                          [number] [default: 100]
  --max-inputs, -I                                       [number] [default: 100]
  --help            Show help                                          [boolean]

```
