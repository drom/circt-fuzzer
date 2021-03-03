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
  assert assume cover
`);

const int = node => (node.signed ? 'S' : 'U') + 'Int';

const intw = node => int(node) + '<' + node.width + '>';

const intwlit = node => intw(node) + '(' + node.value + ')';

const xint = node =>
  node.name + ': ' + intw(node);

const emit = node => {
  if (node.type === 'Int') {
    return intwlit(node);
  }
  if (lut[node.type]) {
    return node.type
      + '('
      + node.arguments.map(arg => emit(arg)).join(', ')
      + ')';
  }
  return node.name;
};

const porter = node => {
  switch (node.type) {
  // case 'input':
  case 'output':
    return [node.type + ' ' + xint(node)];
  }
  return [];
};

const inster = node => {
  switch (node.type) {
  // case 'input':
  case 'inst':
    return [
      'inst ' + node.name + ' of ' + node.modo.name,
      node.name + ' is invalid'
    ];
  }
  return [];
};

const instInputer = node => {
  const res = ['; ' + node.name];
  res.push(node.name + '.reset <= reset');
  res.push(node.name + '.clock <= clock');

  // const modo = node.modo;
  // console.log(modo.inputs);
  //
  // switch (node.type) {
  // // case 'input':
  // case 'inst':
  //   return ['// ' + JSON.stringify(node.modo)];
  // }
  // return [];
  return res;
};

const getType = node => node.id + ': ' +
  ((node.children.length === 0)
    ? intw(node)
    : '{' + node.children.map(getType).join(', ') + '}'
  );


const typeEmitter = type => node => {
  return [type + ' ' + getType(node)];
};

const wireEmitter = node => {
  switch (node.type) {
  case 'wire': return ['wire' + ' ' + xint(node)];
  case 'reg':  return ['reg' + ' ' + xint(node) + ', clock'];
  case 'regr': return ['reg' + ' ' + xint(node) + ', clock with: (reset => (reset, ' + intw(node) + '(0)))'];
  case 'rega': return ['reg' + ' ' + xint(node) + ', clock with: (reset => (arst, ' + intw(node) + '(0)))'];
  }
  return [];
};

const bodyEmitter = node => {
  switch (node.type) {
  case 'input':
    return [];
  case 'output':
  case 'wire':
  case 'reg':
  case 'regr':
  case 'rega':
  case 'inst':
    return [node.name + ' <= ' + emit(node.arguments[0])];
  case 'assert':
  case 'assume':
  case 'cover':
    return [emit(node)];
  case 'skip':
    return ['skip'];
  }

  return [JSON.stringify(node)];
};

module.exports = mod => [].concat(
  mod.inputs.children.flatMap(typeEmitter('input')),
  mod.body.flatMap(porter),
  mod.insts.flatMap(inster),
  // mod.temps.children.flatMap(typeEmitter('reg')),
  mod.body.flatMap(wireEmitter),
  mod.body.flatMap(bodyEmitter),
  mod.insts.flatMap(instInputer)
)
  .join('\n');
