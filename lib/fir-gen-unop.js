'use strict';

const rndNode = require('./fir-rnd-node.js');
const wireRegOutput = require('./fir-wire-reg-output.js');
const getClockName = require('./fir-get-clock-name.js');

const genUnop = (mt, opt) => (type, widther, signer) => nodes => {
  const arg = rndNode(mt, nodes, opt);
  const width  = (typeof widther === 'function') ? widther(arg) : widther;
  const signed = (typeof signer  === 'function')
    ? signer(arg)
    : ((signer === null) || (signer === undefined))
      ? arg.signed
      : signer;

  nodes.push({
    type: wireRegOutput(mt, width),
    clock: getClockName(mt, opt),
    name: 'tmp' + nodes.length,
    width, signed,
    usage: 0,
    items: [{
      type, width, signed,
      items: [arg]
    }]
  });
};

module.exports = genUnop;
