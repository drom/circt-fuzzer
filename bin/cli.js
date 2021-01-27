#!/usr/bin/env node
'use strict';

const { writeFile } = require('fs');
const { promisify } = require('util');

const yargs = require('yargs');
const rnd = require('random-js');

const genCircuit = require('../lib/fir-gen-circuit.js');
const firOutput = require('../lib/fir-output.js');

const writeFileP = promisify(writeFile);

const handler = async opt => {

  opt.seed = opt.seed || ((1000000 * Math.random()) |0);
  const mt = rnd.MersenneTwister19937.seed(opt.seed);

  const circuit = genCircuit(mt, opt);
  const res = firOutput(circuit, opt);

  if (opt.o) {
    await writeFileP(opt.o, res);
  } else {
    console.log(res);
  }
};

yargs
  .option('verbose', {
    type: 'count',
    alias: 'v',
    default: false
  })
  .option('seed', {
    type: 'number',
    alias: 's'
  })
  .option('max-ops', {
    type: 'number',
    alias: 'O',
    default: 100
  })
  .option('max-inputs', {
    type: 'number',
    alias: 'I',
    default: 100
  })
  .option('zero-width', {
    type: 'boolean',
    alias: 'z',
    default: false
  })
  .option('max-width', {
    type: 'number',
    alias: 'm',
    default: 250
  })
  .option('literals', {
    type: 'boolean',
    alias: 'L',
    default: true
  })
  .option('output', {
    type: 'string',
    alias: 'o'
  })
  .option('node-count', {
    type: 'boolean',
    alias: 'n',
    default: false
  })
  .command({
    command: 'fir',
    aliases: ['firrtl'],
    desc: 'generate FIRRTL circuit',
    handler
  })
  .demandCommand()
  .help().argv;
