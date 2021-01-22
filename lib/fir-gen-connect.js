'use strict';

const rndNode = require('./fir-rnd-node.js');
const wireRegOutput = require('./fir-wire-reg-output.js');

const genConnect = (mt, opt) => nodes => {
  const arg = rndNode(mt, nodes, opt);
  const {width, signed} = arg;
  nodes.push({
    type: wireRegOutput(mt),
    name: 'tmp' + nodes.length,
    width, signed,
    usage: 0,
    arguments: [arg]
  });
};

module.exports = genConnect;
