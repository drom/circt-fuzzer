'use strict';

const emitFIRRTL = require('./emit-firrtl.js');

const indent = n => {
  const pad = ' '.repeat(n);
  return text => text
    .split('\n')
    .map(line => ((line.trim === '') ? '' : pad) + line)
    .join('\n');
};

const wrapper = (topName, opt, body) => `; seed: ${opt.seed}
circuit ${topName} :
  module ${topName} :
    input clock: Clock
    input reset: UInt<1>
${indent(4)(body)}
`;

module.exports = (nodes, opt) => {
  const body = emitFIRRTL(nodes);
  const res = wrapper('top_mod', opt, body);
  return res;
};
