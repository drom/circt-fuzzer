#!/usr/bin/env node
'use strict';

const { writeFile } = require('fs');
const { promisify } = require('util');

const yargs = require('yargs');
const rnd = require('random-js');
const irtl = require('irtl');

const genCircuit = require('../lib/fir-gen-circuit.js');
const firOutput = require('../lib/fir-output.js');
const dontTouch = require('../lib/dont-touch.js');

const writeFileP = promisify(writeFile);

const handler = async opt => {
  opt.seed = opt.seed || ((1000000 * Math.random()) |0);
  const mt = rnd.MersenneTwister19937.seed(opt.seed);

  const circuit = genCircuit(mt, opt);

  if (opt.donttouch) {
    const anno = dontTouch(circuit, opt, mt);
    await writeFileP(opt.donttouch, anno);
  }

  const res = firOutput(circuit, opt);

  if (opt.o) {
    await writeFileP(opt.o, res);
  } else {
    console.log(res);
  }
};

// ************************************************** HIER

const getName = n => {
  let res = '';
  for (let i = 0; i < 16; i++) {
    res += String.fromCharCode((n & 15) + 97);
    n = n >>> 4;
    if (n === 0) {
      break;
    }
  }
  return res;
};

const pRandSeq = (length, mt) => Array.from({length})
  .map((e, i) =>
    (i === 0) ? 0 :
      (i === 1) ? 1 :
        rnd.integer(2, i)(mt));

const treeMix = (nums, mods) => {
  const root = [mods[0]];
  const nodes = [root];
  const ilen = nums.length - 1;
  for (let i = 0; i < ilen; i++) {
    const leaf = [mods[i + 1]];
    nodes[nums[i]].push(leaf);
    nodes.push(leaf);
  }
  return root;
};

const picker = mods => {
  return {
    someSource: mt => {
      let total = 0;
      const counts = mods.map(modP => {
        const mod = modP[irtl.identity];
        const defs = Object.keys(mod.defo);
        total += defs.length;
        return defs.length;
      });

      let idx = rnd.integer(0, total - 1)(mt);
      let res;
      counts.some((count, i) => {
        if (idx < count) {
          const modP = mods[i];
          const mod = modP[irtl.identity];
          const defs = Object.keys(mod.defo);
          res = modP[defs[idx]];
          return true;
        }
        idx -= count;
      });
      // console.log(idx, res);
      return res;
    }
  };
};

const makeSomeOps = (mods, opt, mt) => {
  const { xor } = irtl.elements;
  const pick = picker(mods);
  const tb = mods[0];
  // add some initial values
  for (let i = 0; i < opt.I; i++) {
    tb[getName(rnd.integer(0, 0xfff)(mt))] = {
      op: 'literal',
      width: rnd.integer(0, opt.m)(mt),
      value: 1
    };
  }
  for (let i = 0; i < opt.O; i++) {
    const src1 = pick.someSource(mt);
    const src2 = pick.someSource(mt);
    const dstMod = mods[rnd.integer(0, mods.length - 1)(mt)];
    const dstName = getName(rnd.integer(0, 0xfff)(mt));
    dstMod[dstName] = {width: Math.max(src1.width, src2.width)};
    dstMod[dstName] = xor(src1, src2);
    // const srcMod = mods[rnd.integer(0, mods.length - 1)(mt)];
    // const src1Name = getName(rnd.integer(0, 0xfff)(mt));
    // const src2Name = getName(rnd.integer(0, 0xfff)(mt));
    // dstMod[dstName] = xor(srcMod[src1Name, src2Name]);
  }
  // PRCI
  tb.clk = {type: 'Clock'};
  tb.arst = {width: 1};
};

const hierHandler = async opt => {
  opt.seed = opt.seed || ((1000000 * Math.random()) |0);
  const mt = rnd.MersenneTwister19937.seed(opt.seed);

  const nums = pRandSeq(opt.numMods, mt);
  const mods = nums.map((e, i) => {
    const name = (
      (i === 0) ? 'r' :
        (i === 1) ? 'top_mod' :
          getName(i)
    );
    return irtl.createModule(name);
  });
  makeSomeOps(mods, opt, mt);
  const mix = treeMix(nums, mods);
  const circt = irtl.createCircuit('top_mod', mix);
  const res = '; seed: ' + opt.seed + '\n' + irtl.emitFirrtl(circt);
  // const res = irtl.emitVerilog(circt);
  if (opt.o) {
    await writeFileP(opt.o, res);
  } else {
    console.log(res);
  }
};

// ************************************************** HIER

yargs
  .option('output',       {type: 'string',  alias: 'o',                 desc: 'output file name'})
  .option('seed',         {type: 'number',  alias: 's',                 desc: 'seed for pseudo-random generator'})
  .option('verbose',      {type: 'count',   alias: 'v', default: false, desc: 'verbosity level'})
  .option('max-ops',      {type: 'number',  alias: 'O', default: 100,   desc: 'max number of opearations'})
  .option('max-inputs',   {type: 'number',  alias: 'I', default: 100,   desc: 'max number of inputs'})
  .option('zero-width',   {type: 'boolean', alias: 'z', default: true,  desc: 'width of some values -> 0'})
  .option('max-width',    {type: 'number',  alias: 'm', default: 250,   desc: 'Max width of values'})
  .option('literals',     {type: 'boolean', alias: 'L', default: true,  desc: 'make literals'})
  .option('node-count',   {type: 'boolean', alias: 'n', default: false, desc: 'print out number of nodes'})
  .option('verif',        {type: 'boolean',             default: true,  desc: 'assert, assume, cover'})
  .option('fsms',         {type: 'boolean',             default: true,  desc: 'Finite State Machines'})
  .option('bundles',      {type: 'boolean',             default: true,  desc: 'bundles'})
  .option('vectors',      {type: 'boolean',             default: true,  desc: 'vectors'})
  .option('instances',    {type: 'boolean',             default: true,  desc: 'instances'})
  .option('mems',         {type: 'boolean',             default: true,  desc: 'memories'})
  .option('ordered',      {type: 'boolean',             default: true,  desc: 'expressions in SSA order'})
  .option('unsized',      {type: 'boolean',             default: false, desc: 'some unsized nodes'})
  .option('donttouch',    {type: 'string',                              desc: 'donttouch file name'})
  .option('numMods',      {type: 'number',              default: 8,     desc: 'number of modules'})
  .command({
    command: 'fir',
    aliases: ['firrtl'],
    desc: 'generate FIRRTL circuit',
    handler
  })
  .command({
    command: 'hier',
    aliases: ['hierFirrtl'],
    desc: 'generate hierarchical FIRRTL circuit',
    handler: hierHandler
  })
  .demandCommand()
  .help().argv;
