'use strict';

const rnd = require('random-js');

const rndNode = require('./fir-rnd-node.js');
const wireRegOutput = require('./fir-wire-reg-output.js');

const genUnoparam = (mt, opt) => (type, nParams, widther, signer) => nodes => {
  const arg = rndNode(mt, nodes, opt);
  if (arg.width === 0) {
    return;
  }
  const ps = [];
  for (let i = 0; i < nParams; i++) {
    ps.push(rnd.integer(0, arg.width - 1)(mt));
  }
  ps.sort((a, b) => b - a);
  const width  = (typeof widther === 'function') ? widther(arg, ...ps) : widther;

  const signed = (typeof signer  === 'function')
    ? signer(arg)
    : ((signer === null) || (signer === undefined))
      ? arg.signed
      : signer;

  nodes.push({
    type: wireRegOutput(mt, width),
    name: 'tmp' + nodes.length,
    width, signed,
    usage: 0,
    items: [{
      type, width, signed,
      items: [arg].concat(ps.map(p => ({type: 'parameter', name: p})))
    }]
  });
};

module.exports = genUnoparam;
