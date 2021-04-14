#!/usr/bin/env node
'use strict';

const { writeFile } = require('fs');
const { promisify } = require('util');
const { exec, spawn } = require('child_process');

const rnd = require('random-js');

const genCircuit = require('../lib/fir-gen-circuit.js');
const firOutput = require('../lib/fir-output.js');

const execP = promisify(exec);
const writeFileP = promisify(writeFile);

const VFILE1 = 'top_mod.sv';
const VFILE2 = 'top_mod_m.sv';
const DUT = 'top_mod';
const SFC = './firrtl-1.5-SNAPSHOT'; // './firrtl-1.4.0';
const NFC = '../../llvm/circt/build/bin/firtool';

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
<th>firrtl</th>
<th>lint</th>
<th>mlir</th>
<th>lint</th>
<th>lec1</th>
<th>lec2</th>
<!-- <th>sat</th> -->
<!-- <th>max</th> -->
</tr>`
);

const main = async () => {
  for (let seed = 1; seed < 10000; seed++) {

    console.log('<tr>');

    // const { stdout1, stderr1 } = await execP(`./bin/cli.js \
    //   --seed ${seed} \
    //   --max-width 20 \
    //   --max-inputs 20 \
    //   --max-ops 50 \
    //   -n \
    //   fir \
    // `);
    // // -o top_mod.fir \

    console.log('<td>', seed);

    const opt = {
      seed,
      O: 50,
      I: 10,
      bundles: true,
      instances: false,
      mems: false,
      ordered: false,
      fsms: true,
      z: true,
      m: 20,
      L: true,
      o: 'top_mod.fir',
      n: true
    };

    const mt = rnd.MersenneTwister19937.seed(opt.seed);

    const circuit = genCircuit(mt, opt);
    const res = firOutput(circuit, opt);

    if (opt.o) {
      await writeFileP(opt.o, res);
    } else {
      console.log(res);
    }

    console.log('</td>');

    try {
      const { stdout, stderr } = await execP([
        SFC,
        '--dont-fold div',
        '-i top_mod.fir',
        '-X sverilog',
        '-o ' + VFILE1
      ].join(' '));
      console.log('<td>', (stdout || ''), (stderr || ''), '</td>');
    } catch(err) {
      console.log('<td>', (err.stdout || ''), (err.stderr || ''), '</td>');
    }

    try {
      const { stdout, stderr } = await execP(`verilator --top-module top_mod --lint-only ${VFILE1}`);
      console.log('<td>', (stdout || ''), (stderr || ''), '</td>');
    } catch(err) {
      console.log('<td>', (err.stdout || ''), (err.stderr || ''), '</td>');
    }

    try {
      const { stdout, stderr } = await execP([
        NFC,
        'top_mod.fir',
        '--lower-to-rtl',
        '--lower-types',
        '--lowering-options=noAlwaysFF',
        '--verilog',
        '-o=' + VFILE2
      ].join(' '));
      console.log('<td>', (stdout || ''), (stderr || ''), '</td>');
    } catch(err) {
      console.log('<td>', (err.stdout || ''), (err.stderr || ''), '</td>');
    }

    try {
      const { stdout, stderr } = await execP(`verilator --top-module top_mod --lint-only ${VFILE2}`);
      console.log('<td>', (stdout || ''), (stderr || ''), '</td>');
    } catch(err) {
      console.log('<td>', (err.stdout || ''), (err.stderr || ''), '</td>');
    }



    console.log('<td>');
    // const t0 = Date.now();
    try {
      const yosys = await spawn(
        '../../YosysHQ/yosys/yosys', [
          `-q`, `-p`, `read_verilog -sv ${VFILE1}
          rename ${DUT} top1
          proc
          memory
          flatten top1
          hierarchy -top top1
          async2sync
          read_verilog -sv ${VFILE2}
          rename ${DUT} top2
          proc
          memory
          flatten top2
          equiv_make top1 top2 equiv
          hierarchy -top equiv
          async2sync
          clean -purge
          equiv_simple -undef -short
          equiv_induct -undef -seq 50
          equiv_status -assert
        `]
      );

      // equiv_simple -short -undef
      // equiv_induct -undef
      // equiv_status -assert

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
        // console.log('T = ' + ((Date.now() - t0) / 1000));
        console.log(err);
        clearTimeout(tot);
      });
      yosys.on('exit', () => {
        // console.log('T = ' + ((Date.now() - t0) / 1000));
        clearTimeout(tot);
      });
    } catch (err) {
      console.log(err);
    }


    console.log('<td>');
    // const t0 = Date.now();
    try {
      const yosys = await spawn(
        '../../YosysHQ/yosys/yosys', [
          `-q`, `-p`, `read_verilog -sv ${VFILE1}
          rename ${DUT} top1
          proc
          memory
          flatten top1
          hierarchy -top top1
          async2sync
          read_verilog -sv ${VFILE2}
          rename ${DUT} top2
          proc
          memory
          flatten top2
          equiv_make top1 top2 equiv
          hierarchy -top equiv
          async2sync
          equiv_simple -undef -short
          equiv_induct -undef -seq 50
          equiv_status -assert
        `]
      );

      // equiv_simple -short -undef
      // equiv_induct -undef
      // equiv_status -assert

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
        // console.log('T = ' + ((Date.now() - t0) / 1000));
        console.log(err);
        clearTimeout(tot);
      });
      yosys.on('exit', () => {
        // console.log('T = ' + ((Date.now() - t0) / 1000));
        clearTimeout(tot);
      });
    } catch (err) {
      console.log(err);
    }



    // console.log('<td>');
    // // const t0 = Date.now();
    // try {
    //   const yosys = await spawn(
    //     '../../YosysHQ/yosys/yosys', [
    //       `-q`, `-p`, `read_verilog -sv ${VFILE1}
    //       rename ${DUT} top1
    //       proc
    //       memory
    //       flatten top1
    //       hierarchy -top top1
    //       read_verilog -sv ${VFILE2}
    //       rename ${DUT} top2
    //       proc
    //       memory
    //       flatten top2
    //       clean -purge
    //       miter -equiv -make_assert -flatten top1 top2 miter
    //       sat -verify -prove-asserts -enable_undef -show-public miter
    //     `]
    //   );
    //
    //   // equiv_simple -short -undef
    //   // equiv_induct -undef
    //   // equiv_status -assert
    //
    //   const tot = setTimeout(() => {
    //     console.log('timeout ' + seed);
    //     yosys.kill(9);
    //   }, 10000);
    //   for await (const err of yosys.stderr) {
    //     console.log(err.toString());
    //   }
    //   for await (const out of yosys.stdout) {
    //     console.log(out.toString());
    //   }
    //   yosys.on('error', err => {
    //     // console.log('T = ' + ((Date.now() - t0) / 1000));
    //     console.log(err);
    //     clearTimeout(tot);
    //   });
    //   yosys.on('exit', () => {
    //     // console.log('T = ' + ((Date.now() - t0) / 1000));
    //     clearTimeout(tot);
    //   });
    // } catch (err) {
    //   console.log(err);
    // }
    //
    // console.log('<td>');
    // // const t0 = Date.now();
    // try {
    //   const yosys = await spawn(
    //     '../../YosysHQ/yosys/yosys', [
    //       `-q`, `-p`, `read_verilog -sv ${VFILE1}
    //       rename ${DUT} top1
    //       proc
    //       memory
    //       flatten top1
    //       hierarchy -top top1
    //       read_verilog -sv ${VFILE2}
    //       rename ${DUT} top2
    //       proc
    //       memory
    //       flatten top2
    //       clean -purge
    //       miter -equiv -make_assert -flatten top1 top2 miter
    //       sat -verify -prove-asserts -enable_undef -max_undef -show-public miter
    //     `]
    //   );
    //
    //   // equiv_simple -short -undef
    //   // equiv_induct -undef
    //   // equiv_status -assert
    //
    //   const tot = setTimeout(() => {
    //     console.log('timeout ' + seed);
    //     yosys.kill(9);
    //   }, 10000);
    //   for await (const err of yosys.stderr) {
    //     console.log(err.toString());
    //   }
    //   for await (const out of yosys.stdout) {
    //     console.log(out.toString());
    //   }
    //   yosys.on('error', err => {
    //     // console.log('T = ' + ((Date.now() - t0) / 1000));
    //     console.log(err);
    //     clearTimeout(tot);
    //   });
    //   yosys.on('exit', () => {
    //     // console.log('T = ' + ((Date.now() - t0) / 1000));
    //     clearTimeout(tot);
    //   });
    // } catch (err) {
    //   console.log(err);
    // }


    console.log('</tr>');



  }
};

main();

/* eslint complexity:0 */
