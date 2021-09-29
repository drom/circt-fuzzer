#!/usr/bin/env node
'use strict';

const { writeFile } = require('fs');
const { promisify } = require('util');

const yargs = require('yargs');
const rnd = require('random-js');

const genCircuit = require('../lib/fir-gen-circuit.js');
const genHierCircuit = require('../lib/fir-gen-hier-circuit.js');
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

const hierHandler = async opt => {
  opt.seed = opt.seed || ((1000000 * Math.random()) |0);
  const mt = rnd.MersenneTwister19937.seed(opt.seed);

  const res = genHierCircuit(opt, mt);

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
  .option('numMods',      {type: 'number',              default: 5,     desc: 'number of modules'})
  .option('numClocks',    {type: 'number',  alias: 'c', default: 2,     desc: 'number of clocks'})
  .option('unusedMods',   {type: 'boolean',             default: false, desc: 'allow unused modules'})
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
