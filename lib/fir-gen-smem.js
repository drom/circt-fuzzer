'use strict';

const rnd = require('random-js');

const genMem = (mt, opt) => nodes => {
  if (!opt.mems) {
    return;
  }
  const memName = 'tmp' + nodes.length;
  const depth = rnd.integer(1, 17)(mt);
  const width = rnd.integer(opt.z ? 0 : 1, 10)(mt);
  const signed = rnd.bool()(mt);
  nodes.push({
    type: 'smem',
    name: memName,
    usage: 0,
    width, signed,
    depth
  });
};

module.exports = genMem;
