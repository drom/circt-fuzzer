'use strict';

const rndNode = require('./fir-rnd-node.js');
const wireRegOutput = require('./fir-wire-reg-output.js');

const genUnop = (mt, opt) => (type, widther, signer) => nodes => {
  const arg = rndNode(mt, nodes, opt);
  const width  = (typeof widther === 'function') ? widther(arg) : widther;
  const signed = (typeof signer  === 'function')
    ? signer(arg)
    : ((signer === null) || (signer === undefined))
      ? arg.signed
      : signer;

  nodes.push({
    type: wireRegOutput(mt),
    name: 'tmp' + nodes.length,
    width, signed,
    usage: 0,
    arguments: [{
      type, width, signed,
      arguments: [arg]
    }]
  });
};

module.exports = genUnop;
