#!/usr/bin/env node
'use strict';

const { writeFile, unlink } = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');
const rnd = require('random-js');

const genCircuit = require('../lib/fir-gen-circuit.js');
const firOutput = require('../lib/fir-output.js');

const execP = promisify(exec);
const writeFileP = promisify(writeFile);

const DUT = 'kataba';
// const VFILE1 = 'top_mod.v';
const VFILE2 = DUT + '_m.v';
const NFC = '../../llvm/circt/build/bin/firtool';

const main = async () => {
  for (let seed = 1; seed < 10000; seed++) {
    const opt = {
      seed,
      O: 100,
      I: 20,
      bundles: true,
      vectors: true,
      instances: true,
      mems: true,
      ordered: true,
      fsms: true,
      z: true,
      m: 20,
      L: true,
      // o: DUT + seed + '.fir',
      n: false
    };
    const mt = rnd.MersenneTwister19937.seed(opt.seed);

    const circuit = genCircuit(mt, opt);
    const res = firOutput(circuit, opt);

    for (let cuti = 0; cuti < 1000; cuti++) {
      const cutLength = rnd.integer(1, res.length)(mt);

      opt.o = 'kataba.' + seed + '.fir.' + cutLength;

      await writeFileP(opt.o, res.slice(0, cutLength));

      try {
        const { stdout, stderr } = await execP([
          NFC,
          opt.o,
          '--format=fir',
          '--lower-to-hw',
          '--infer-widths',
          '--imconstprop',
          '--verilog',
          '-o=' + VFILE2
        ].join(' '));
        if (stdout !== '') console.log(stdout);
        if (stderr !== '') console.log(stderr);
        unlink(opt.o, err => { if (err) { console.error(err); } });
      } catch(err) {
        if (err.stdout) {
          console.log(err.stdout);
          continue;
        }
        if (err.stderr.match(': error: ')) {
          unlink(opt.o, err => { if (err) console.error(err); });
          continue;
        }
        console.log(err.stderr);
      }
    }
  }
};

main();

/* eslint complexity:0 */
