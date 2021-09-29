'use strict';

const rnd = require('random-js');

const wireRegOutput = require('./fir-wire-reg-output.js');
const rndNode = require('./fir-rnd-node.js');
const flipSign = require('./fir-flip-sign.js');
const getClockName = require('./fir-get-clock-name.js');

const genBinop = (mt, opt) => (type, widther, signer, fmt) => nodes => {

  const args = [0, 1].map(() => rndNode(mt, nodes, opt));

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
        items: [args[1], {type: 'parameter', name: args[1].width - resw}]
      } : {
        type: 'head', width: resw,
        items: [args[1], {type: 'parameter', name: resw}]
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

  const rootType = wireRegOutput(mt, width);
  const name = (rnd.bool()(mt) ? '_' : '')
    + 'tmp' + nodes.length;
  nodes.push({
    type: rootType,
    clock: getClockName(mt, opt),
    name,
    width, signed,
    usage: 0,
    items: [{
      type, width, signed,
      items: args
    }]
  });
};

module.exports = genBinop;
