#!/usr/bin/env node
'use strict';

const util = require('util');
const { exec, spawn } = require('child_process');

const genFIRRTL = require('../lib/gen-firrtl.js');

const execP = util.promisify(exec);

const VFILE1 = 'top_mod.v';
const VFILE2 = 'top_mod_m.v';
const DUT = 'top_mod';

console.log(`
<script src="main.js"></script>
<style>
table { width: 100%; border-collapse: collapse; }
table, th, td { border: 1px solid black; }
th, td { padding: 6px; }
td { white-space: pre; }
</style>
<table id="log">
<tr>
<th>seed</th>
<th>firrtl</th>
<th>lint</th>
<th>mlir</th>
<th>lint</th>
<th>yosys</th>
</tr>`
);

const main = async () => {
  for (let seed = 1; seed < 10000; seed++) {

    console.log('<tr>');

    const { stdout1, stderr1 } = await execP(`./bin/cli.js \
      --seed ${seed} \
      --max-width 20 \
      --max-inputs 20 \
      --max-ops 50 \
      -n \
      fir \
    `);
    // -o top_mod.fir \

    console.log('<td>', seed);
    genFIRRTL({
      seed,
      O: 10,
      I: 10,
      z: false,
      m: 20,
      L: true,
      o: 'top_mod.fir',
      n: true,
    });
    console.log('</td>');

    try {
      const { stdout, stderr } = await execP('./firrtl-1.4.0 -i top_mod.fir');
      console.log('<td>', (stdout || ''), (stderr || ''), '</td>');
    } catch(err) {
      console.log('<td>', (err.stdout || ''), (err.stderr || ''), '</td>');
    }

    try {
      const { stdout, stderr } = await execP(`verilator --lint-only ${VFILE1}`);
      console.log('<td>', (stdout || ''), (stderr || ''), '</td>');
    } catch(err) {
      console.log('<td>', (err.stdout || ''), (err.stderr || ''), '</td>');
    }

    try {
      const { stdout, stderr } = await execP(`../../llvm/circt/build/bin/firtool \
          top_mod.fir \
          --lower-to-rtl \
          --verilog -o=${VFILE2}
      `);
      console.log('<td>', (stdout || ''), (stderr || ''), '</td>');
    } catch(err) {
      console.log('<td>', (err.stdout || ''), (err.stderr || ''), '</td>');
    }

    try {
      const { stdout, stderr } = await execP(`verilator --lint-only ${VFILE2}`);
      console.log('<td>', (stdout || ''), (stderr || ''), '</td>');
    } catch(err) {
      console.log('<td>', (err.stdout || ''), (err.stderr || ''), '</td>');
    }

    console.log('<td>');
    try {
      const yosys = await spawn(
        '../../YosysHQ/yosys/yosys', [
          `-q`, `-p`, `read_verilog ${VFILE1}
          rename ${DUT} top1
          proc
          memory
          flatten top1
          hierarchy -top top1
          read_verilog ${VFILE2}
          rename ${DUT} top2
          proc
          memory
          flatten top2
          equiv_make top1 top2 equiv
          hierarchy -top equiv
          clean -purge
          equiv_simple -short
          equiv_induct
          equiv_status -assert
        `]
      );
      const tot = setTimeout(() => {
        console.log('timeout ' + seed);
        yosys.kill(9);
      }, 10000);
      for await (const err of yosys.stderr) {
        console.log(err.toString());
      }
      for await (const out of yosys.stdout) {
        console.log(out.toString());
      }
      yosys.on('error', err => {
        console.log(err);
        clearTimeout(tot);
      });
      yosys.on('exit', () => {
        clearTimeout(tot);
      });
    } catch (err) {
      console.log(err);
    }

    console.log('</tr>');
  }
};

main();

/* eslint complexity:0 */