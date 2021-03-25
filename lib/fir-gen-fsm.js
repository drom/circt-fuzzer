'use strict';

// const rnd = require('random-js');
// const rndNode = require('./fir-rnd-node.js');

const genFsm = (mt, opt) => nodes => {
  if (!opt.fsms) {
    return;
  }
  const numStates = 2; // rnd.integer(2, 10)(mt);
  const width = Math.ceil(Math.log2(numStates));
  const signed = false;
  const state = {
    type: 'rega',
    name: 'state_' + nodes.length,
    width, signed,
    // arguments: [next]
  };
  const next = {
    type: 'wire',
    name: 'next_' + nodes.length,
    width, signed,
    arguments: [{
      type: 'add',
      width, signed,
      arguments: [
        state,
        {type: 'Int', width, signed, value: 1}
      ]
    }]
  };
  state.arguments = [next];
  nodes.push(state);
  nodes.push(next);
};

module.exports = genFsm;
