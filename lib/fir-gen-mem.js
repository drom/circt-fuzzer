'use strict';

const range = require('lodash.range');
const rnd = require('random-js');
const rndNode = require('./fir-rnd-node.js');
const flipSign = require('./fir-flip-sign.js');
const wireRegOutput = require('./fir-wire-reg-output.js');

const rndSigNode = (mt, nodes, opt, signed) => {
  const res = [rndNode(mt, nodes, opt)];
  if (res[0].signed !== signed) { flipSign(mt, res, 0); }
  return res[0];
};

const rndSig1bitNode = (mt, nodes, opt, signed) => {
  const res = [rndSigNode(mt, nodes, opt, signed)];
  if (res[0].width > 1) {
    return {
      type: 'head', width: 1,
      items: [
        res[0],
        {type: 'parameter', name: 1}
      ]
    };
  }
  return res[0];
};

const genMem = (mt, opt) => nodes => {
  if (!opt.mems) {
    return;
  }
  const depth = rnd.integer(1, 17)(mt);
  const width = rnd.integer(opt.z ? 0 : 1, 10)(mt);
  const signed = rnd.bool()(mt);
  const readers = range(rnd.integer(1, 3)(mt))
    .map(port => {
      return {
        name: 'r' + port,
        clk: 'clock',
        en: rndSig1bitNode(mt, nodes, opt, false),
        addr: rndSigNode(mt, nodes, opt, false)
      };
    });
  const writers = range(rnd.integer(0, 3)(mt))
    .map(port => {
      return {
        name: 'w' + port,
        clk: 'clock',
        en: rndSig1bitNode(mt, nodes, opt, false),
        mask: rndSigNode(mt, nodes, opt, false),
        data: rndSigNode(mt, nodes, opt, signed),
        addr: rndSigNode(mt, nodes, opt, false)
      };
    });
  const memName = 'tmp' + nodes.length;
  nodes.push({
    type: 'mem',
    name: memName,
    usage: 0,
    width, signed,
    depth,
    readers,
    writers,
    readLatency: rnd.integer(0, 3)(mt),
    writeLatency: rnd.integer(1, 3)(mt),
    readUnderWrite: undefined
  });
  readers.map(port => {
    nodes.push({
      type: wireRegOutput(mt, width),
      name: 'tmp' + nodes.length,
      width, signed,
      usage: 0,
      items: [{
        name: memName + '.' + port.name + '.data'
      }]
    });
  });
};

module.exports = genMem;
