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

const DUT = 'top_mod_crash';
// const VFILE1 = 'top_mod.v';
const VFILE2 = DUT + '_m.v';

console.log(`
<script src="tabler.js"></script>
<style>
table { width: 100%; border-collapse: collapse; }
table, th, td { border: 1px solid black; }
th, td { padding: 0 6; }
.warning { background: #ff0; color: #000; }
.error { background: #f00; color: #000; }
.timeout { background: #222; color: #fff; }
.unproven { background: #714200; color: #ff8c8c; }
.fail { background: #870000; color: #fcabff; }
</style>
<table id="log">
<tr>
<th>seed</th>
<th>mlir</th>
</tr>`
);

const main = async () => {
  for (let seed = 1; seed < 10000; seed++) {
    const opt = {
      seed,
      O: 30000,
      I: 100,
      bundles: true,
      vectors: true,
      instances: false,
      mems: false,
      ordered: true,
      fsms: true,
      z: true,
      m: 20,
      L: true,
      o: DUT + seed + '.fir',
      n: false
    };
    const mt = rnd.MersenneTwister19937.seed(opt.seed);

    const circuit = genCircuit(mt, opt);
    const res = firOutput(circuit, opt);

    if (opt.o) {
      await writeFileP(opt.o, res);
    } else {
      console.log(res);
    }
    console.log(seed);

    try {
      const { stdout, stderr } = await execP(`../../llvm/circt/build/bin/firtool \
        ${DUT + seed}.fir \
        --lower-to-hw \
        --expand-whens \
        --infer-widths \
        --lowering-options=noAlwaysFF \
        --mlir-timing \
        --verilog -o=${VFILE2}
      `);
      unlink(DUT + seed + '.fir', err => { if (err) { console.error(err); } });
      if (stderr.trim() !== '') {
        console.log('<tr>');
        console.log('<td>', seed);
        console.log('</td>');
        console.log('<td>', (stdout || ''), (stderr || ''), '</td>');
        console.log('</tr>');
      }
    } catch(err) {
      console.log('<tr>');
      console.log('<td>', seed);
      console.log('</td>');
      console.log('<td>', (err.stdout || ''), (err.stderr || ''), '</td>');
      console.log('</tr>');
    }
  }
};

main();

/* eslint complexity:0 */
