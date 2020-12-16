#!/usr/bin/env node
'use strict';

const yargs = require('yargs');
const lib = require('../lib/index.js');

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
  .option('literals', {
    type: 'boolean',
    alias: 'L',
    default: true
  })
  .command({
    command: 'fir',
    aliases: ['firrtl'],
    desc: 'generate FIRRTL circuit',
    handler: lib.genFIRRTL
  })
  .demandCommand()
  .help().argv;
