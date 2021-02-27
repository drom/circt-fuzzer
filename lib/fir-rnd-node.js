'use strict';

const rnd = require('random-js');

const rndLiteral = require('./rnd-literal.js');

const rndNode = (mt, nodes, opt) => {
  if (opt.L && rnd.bool()(mt)) {
    return rndLiteral(mt, rnd.integer(1, 31)(mt), rnd.bool()(mt));
  }
  const node = nodes[rnd.integer(0, nodes.length - 1)(mt)];
  switch (node.type) {
  case 'input':
  case 'wire':
  case 'reg':
    node.usage++;
    return node;
  }
  return rndLiteral(mt, rnd.integer(1, 31)(mt), rnd.bool()(mt));
};

module.exports = rndNode;
