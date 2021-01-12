'use strict';

const rnd = require('random-js');

const wireRegOutput = require('./fir-wire-reg-output.js');
const rndNode = require('./fir-rnd-node.js');
const flipSign = require('./fir-flip-sign.js');

const genBinop = (mt, opt) => (type, widther, signer, fmt) => nodes => {

  let args;
  do {
    args = [0, 1].map(() => rndNode(mt, nodes, opt));
  } while((type === 'div') && (args[0] === args[1])); // workaround https://github.com/chipsalliance/firrtl/issues/2029

  if (fmt === 'XU') {
    if (args[1].signed) {
      flipSign(mt, args, 1);
    }
  } else
  if (fmt === 'Xu') {
    if (args[1].signed) {
      flipSign(mt, args, 1);
    }
    if (args[1].width > 10) {
      const resw = rnd.integer((opt.z ? 0 : 1), 10)(mt);
      args[1] = rnd.bool()(mt) ? {
        type: 'tail', width: resw,
        arguments: [args[1], {type: 'parameter', name: args[1].width - resw}]
      } : {
        type: 'head', width: resw,
        arguments: [args[1], {type: 'parameter', name: resw}]
      };
    }
  } else { // XX the same sign
    if (args[0].signed !== args[1].signed) {
      flipSign(mt, args, rnd.integer(0, 1)(mt));
    }
  }

  const width  = (typeof widther === 'function') ? widther(args) : widther;

  const signed = (typeof signer  === 'function')
    ? signer(args)
    : ((signer === null) || (signer === undefined))
      ? args[0].signed // default
      : signer;

  nodes.push({
    type: wireRegOutput(mt),
    name: 'tmp' + nodes.length,
    width, signed,
    usage: 0,
    arguments: [{
      type, width, signed,
      arguments: args
    }]
  });
};

module.exports = genBinop;
