'use strict';

const emitFIRRTL = require('./emit-firrtl.js');

const indent = n => {
  const pad = ' '.repeat(n);
  return text => text
    .split('\n')
    .map(line => ((line.trim === '') ? '' : pad) + line)
    .join('\n');
};

module.exports = (circuit, opt) => {
  let res = [
    '; seed: ' + opt.seed,
    'circuit top_mod :'
  ];

  res = res.concat(circuit.flatMap(mod => [
    '  module ' + mod.name + ' :',
    '    input clock: Clock',
    '    input reset: UInt<1>',
    indent(4)(emitFIRRTL(mod.body))
  ]));
  return res.join('\n');
};
