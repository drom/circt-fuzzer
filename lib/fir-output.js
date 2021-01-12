'use strict';

const fs = require('fs');

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
${indent(4)(body)}
`;

module.exports = (nodes, opt) => {
  const body = emitFIRRTL(nodes);

  const res = wrapper('top_mod', opt, body);
  if (opt.o) {
    fs.writeFile(opt.o, res, () => {});
  } else {
    console.log(res);
  }
};
