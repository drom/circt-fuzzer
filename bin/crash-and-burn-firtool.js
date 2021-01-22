#!/usr/bin/env node
'use strict';

const { writeFile } = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');

const genBody = require('../lib/fir-gen-body.js');
// const genFIRRTL = require('../lib/gen-firrtl.js');
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
      O: 5000,
      I: 100,
      z: true,
      m: 2000,
      L: true,
      o: DUT + seed + '.fir',
      n: false
    };
    const ast = genBody(opt);
    const res = firOutput(ast, opt);
    if (opt.o) {
      await writeFileP(opt.o, res);
    } else {
      console.log(res);
    }

    try {
      const { stdout, stderr } = await execP(`../../llvm/circt/build/bin/firtool \
          ${DUT + seed}.fir \
          --lower-to-rtl \
          --verilog -o=${VFILE2}
      `);
      fs.unlink(DUT + seed + '.fir', err => { if (err) { console.error(err); } });
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
