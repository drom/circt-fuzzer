'use strict';

const getLut = str => str
  .trim()
  .split(/\s+/)
  .reduce((res, e) => {
    res[e.trim()] = true;
    return res;
  }, {});

const lut = getLut(`
  asUInt  asSInt
  cvt
  neg  not
  andr  orr  xorr

  bits tail head
  pad
  add  sub
  mul  div  rem
  lt  leq  gt  geq  eq  neq
  shl  shr
  dshl dshr
  and  or  xor
  cat
  mux validif
`);

const xint = node =>
  node.name + ': ' + (node.signed ? 'S' : 'U') +'Int<' + node.width + '>';

const emit = node => {
  if (node.type === 'Int') {
    return (node.signed ? 'S' : 'U') + node.type
      + '<' + node.width + '>(' + node.value + ')';
  }
  if (lut[node.type]) {
    return node.type
      + '('
      + node.arguments.map(arg => emit(arg)).join(', ')
      + ')';
  }
  return node.name;
};

const portEmitter = (res, node) => {
  switch (node.type) {
  case 'input':
  case 'output':
    return res.concat(node.type + ' ' + xint(node));
  }
  return res;
};

const wireEmitter = (res, node) => {
  switch (node.type) {
  case 'wire':
    return res.concat(node.type + ' ' + xint(node));
  case 'reg':
    return res.concat(node.type + ' ' + xint(node) + ', clock');
  }
  return res;
};

const bodyEmitter = (res, node) => {
  switch (node.type) {
  case 'input':
    return res;
  case 'output':
  case 'wire':
  case 'reg':
    return res.concat(node.name + ' <= ' + emit(node.arguments[0]));
  }
  return res.concat(JSON.stringify(node));
};

module.exports = nodes =>
  nodes.reduce(portEmitter, []).concat(
    nodes.reduce(wireEmitter, []),
    nodes.reduce(bodyEmitter, [])
  )
    .join('\n');
