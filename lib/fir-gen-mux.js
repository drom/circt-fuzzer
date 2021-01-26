'use strict';

const rnd = require('random-js');

const rndNode = require('./fir-rnd-node.js');
const rndLiteral = require('./rnd-literal.js');
const flipSign = require('./fir-flip-sign.js');
const wireRegOutput = require('./fir-wire-reg-output.js');

const genMux = (mt, opt) => nodes => {
  const args = [0, 1, 2].map(() => rndNode(mt, nodes, opt));
  if (args[1].signed !== args[2].signed) {
    flipSign(mt, args, rnd.integer(1, 2)(mt));
  }
  const width = Math.max(args[1].width, args[2].width);

  if (args[0].width === 0) {
    args[0] = rndLiteral(mt, 1, rnd.bool()(mt));
  }
  if (args[0].signed) {
    flipSign(mt, args, 0);
  }
  if (args[0].width > 1) {
    args[0] = rnd.bool()(mt) ? {
      type: 'tail', width: 1,
      arguments: [args[0], {type: 'parameter', name: args[0].width - 1}]
    } : {
      type: 'head', width: 1,
      arguments: [args[0], {type: 'parameter', name: 1}]
    };
  }
  const signed = args[1].signed;
  nodes.push({
    type: wireRegOutput(mt, width),
    name: 'tmp' + nodes.length,
    width, signed,
    usage: 0,
    arguments: [{
      type: 'mux',
      width, signed,
      arguments: args
    }]
  });
};

module.exports = genMux;
