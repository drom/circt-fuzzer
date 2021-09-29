'use strict';

const emitFIRRTL = require('./emit-firrtl.js');

const indent = n => {
  const pad = ' '.repeat(n);
  return text => text
    .split('\n')
    .map(line => ((line.trim === '') ? '' : pad) + line)
    .join('\n');
};

const clocks = opt => {
  const res = [];
  for (let i = 0; i < opt.numClocks; i++) {
    res.push(`    input clock${i}: Clock`);
  }
  return res;
};

module.exports = (circuit, opt) => {
  let res = [
    '; seed: ' + opt.seed,
    'circuit top_mod :'
  ];

  res = res.concat(circuit.flatMap(mod => [
    '  module ' + mod.name + ' :',
    ...clocks(opt),
    '    input reset: ' + ((mod.name === 'top_mod') ? 'UInt<1>' : 'Reset'),
    '    input arst: AsyncReset',
    indent(4)(emitFIRRTL(mod))
  ]));
  return res.join('\n');
};
