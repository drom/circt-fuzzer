'use strict';

const rndNode = require('./fir-rnd-node.js');
const wireRegOutput = require('./fir-wire-reg-output.js');
const getClockName = require('./fir-get-clock-name.js');

const genConnect = (mt, opt) => nodes => {
  const arg = rndNode(mt, nodes, opt);
  const {width, signed} = arg;
  nodes.push({
    type: wireRegOutput(mt, width),
    clock: getClockName(mt, opt),
    name: 'tmp' + nodes.length,
    width, signed,
    usage: 0,
    items: [arg]
  });
};

module.exports = genConnect;
