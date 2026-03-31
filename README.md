# circt-fuzzer

[![NPM version](https://img.shields.io/npm/v/circt-fuzzer.svg)](https://www.npmjs.org/package/circt-fuzzer)
[![Status](https://github.com/drom/circt-fuzzer/workflows/Tests/badge.svg)](https://github.com/drom/circt-fuzzer/actions)

Generator of random FIRRTL circuits for testing [CIRCT](https://github.com/llvm/circt) and other FIRRTL-based tools.

## Rationale

Fuzzing is a critical component in the development and verification of hardware description language (HDL) compilers and synthesis tools. This project serves several key objectives:

- **Tool Development & Stability**: Compilers like CIRCT are highly complex, with numerous optimization passes and lowering steps. Randomly generated circuits can stress-test edge cases that are often overlooked in manually written test suites, ensuring the compiler remains stable as new features are added.
- **Automated Debugging**: By generating randomized yet valid FIRRTL, the fuzzer can automatically discover inputs that trigger compiler crashes (Internal Compiler Errors) or incorrect hardware generation. Tools like `kataba.js` in this repository further help by minimizing these "crashers" into small, actionable test cases.
- **Maximizing Code Coverage**: Traditional tests often follow "happy paths." Fuzzing explores the state space of the compiler more exhaustively, reaching deep into corner cases of the intermediate representation (IR) and optimization logic to improve overall code coverage.
- **Differential Testing & Independence**: One of the most powerful uses of this fuzzer is **Logical Equivalence Checking (LEC)**. By generating a circuit and passing it through two different toolchains (e.g., the Scala FIRRTL Compiler and CIRCT's `firtool`), we can compare the resulting Verilog for equivalence. An independent implementation of the generator ensures that we are not just testing the compiler against its own assumptions, but against the formal FIRRTL specification.
- **Verification Frameworks**: High-quality hardware requires rigorous verification. This fuzzer can generate complex verification statements (`assert`, `assume`, `cover`) within random logic to ensure that formal verification tools and simulators correctly handle property checking.

## Install

```bash
npm i -g circt-fuzzer
```

## Usage

The main CLI tool is `circt-fuzzer`. It provides two primary commands: `fir` for flat circuits and `hier` for hierarchical circuits.

```bash
circt-fuzzer fir [options]
circt-fuzzer hier [options]
```

### Options

| Option | Alias | Default | Description |
|---|---|---|---|
| `--output` | `-o` | | Output file name |
| `--seed` | `-s` | random | Seed for pseudo-random generator |
| `--verbose` | `-v` | `false` | Verbosity level |
| `--max-ops` | `-O` | `100` | Max number of operations per module |
| `--max-inputs` | `-I` | `100` | Max number of inputs |
| `--max-width` | `-m` | `250` | Max width of values |
| `--zero-width` | `-z` | `true` | Allow zero-width values |
| `--literals` | `-L` | `true` | Generate random literals |
| `--verif` | | `true` | Include `assert`, `assume`, `cover` statements |
| `--fsms` | | `true` | Generate Finite State Machines |
| `--bundles` | | `true` | Generate Bundle types |
| `--vectors` | | `true` | Generate Vector types |
| `--mems` | | `true` | Generate Memories |
| `--instances` | | `true` | Generate Module instances |
| `--ordered` | | `true` | Emit expressions in SSA order |
| `--unsized` | | `false` | Emit some unsized nodes |
| `--numMods` | | `5` | Number of modules (for `hier`) |
| `--numClocks` | `-c` | `2` | Number of clocks |
| `--donttouch` | | | Path to output a `donttouch` annotation file |

## Features

- **Comprehensive FIRRTL Support**: Generates circuits using a wide range of FIRRTL operations (arithmetic, logical, bitwise, etc.).
- **Complex Data Types**: Supports Bundles and Vectors for both ports and internal signals.
- **Stateful Elements**: Generates Registers, Memories, and FSMs.
- **Hierarchy**: Can generate multiple modules with random instantiations.
- **Verification**: Emits verification statements to test compiler handling of properties.
- **SSA Order**: Can optionally emit expressions in SSA order or randomized order.

## Experimental Tools

The project includes several experimental scripts in the `bin/` directory:

- **`run-all.js`**: A comprehensive test runner that:
  1. Generates a random circuit.
  2. Compiles it using both the Scala FIRRTL Compiler (SFC) and `firtool`.
  3. Lints the output using Verilator.
  4. Performs Logical Equivalence Checking (LEC) using Yosys.
- **`crash-and-burn-firtool.js`**: Stress tests `firtool` by generating very large random circuits and checking for compiler crashes.
- **`kataba.js`**: A minimization tool that finds small reproducers for parser crashes by randomly truncating valid FIRRTL files.
- **`extract-tg.js`**: Extracts dialect information from LLVM TableGen files (internal development tool).

## API

You can also use the fuzzer as a library:

```javascript
const { genCircuit, firOutput } = require('circt-fuzzer');
const rnd = require('random-js');

const mt = rnd.MersenneTwister19937.seed(42);
const options = { maxOps: 50 };

const circuit = genCircuit(mt, options);
const firrtlSource = firOutput(circuit, options);

console.log(firrtlSource);
```

## References

- [FIRRTL Specification](https://github.com/chipsalliance/firrtl/blob/master/spec/spec.md)
- [CIRCT Project](https://github.com/llvm/circt)
- [Google Fuzzing Resources](https://github.com/google/fuzzing)

## License

MIT
