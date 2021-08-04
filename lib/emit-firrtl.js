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

const int = node =>
  (node.signed ? 'S' : 'U') + 'Int';

const intw = node =>
  int(node) + ((node.width === undefined) ? '' : '<' + node.width + '>');

const intwlit = node =>
  intw(node) + '(' + node.value + ')';

const indent = (ind, str) => '  '.repeat(ind) + str;

const xint = node =>
  node.name + ': ' + intw(node);

const emit = node => {
  if (node.type === 'invalid') {
    return node.type;
  }
  if (node.type === 'Int') {
    return intwlit(node);
  }
  if (lut[node.type]) {
    return node.type
      + '('
      + node.items.map(item => emit(item)).join(', ')
      + ')';
  }
  return node.name;
};

const emitWhen = node => {
  if (node.items.length !== 1) {
    throw new Error();
  }

  const res = [];

  const prefix = (node.type === 'node') ? 'node ' : '';
  const atype =
    (node.items[0].type === 'invalid') ? ' is ' :
      (node.type === 'node') ? ' = ' :
        ' <= ';

  const rec = (n, ind) => {
    if (n.type !== 'when') {
      res.push(indent(ind, prefix + node.name + atype + emit(n)));
      return;
    }
    const cases = n.cases || [];
    const ilen = cases.length;

    if (ilen === 0) {
      res.push(indent(ind + 1, '; nothing to do'));
    } else
    if (ilen === 1) {
      rec(cases[0].value, ind + 1);
    } else {
      res.push(indent(ind, 'when ' + emit(cases[0].cond) + ' :'));
      rec(cases[0].value, ind + 1);

      for (let i = 1; i < (ilen - 1); i++) {
        res.push(indent(ind, 'else when ' + emit(cases[i].cond) + ' :'));
        rec(cases[i].value, ind + 1);
      }

      res.push(indent(ind, 'else :'));
      rec(cases[ilen - 1].value, ind + 1);
    }
  };

  rec(node.items[0], 0);
  return res;
};

const emitMem = node => {
  const res = [
    'mem ' + node.name + ':',
    '  data-type => ' + intw(node),
    '  depth => ' + node.depth,
    '  read-latency => ' + node.readLatency,
    '  write-latency => ' + node.writeLatency,
    '  read-under-write => ' + node.readUnderWrite
  ]
    .concat(
      node.readers.map(e => '  reader => ' + e.name),
      node.writers.map(e => '  writer => ' + e.name),
      node.readers.flatMap(e => [
        node.name + '.' + e.name + '.clk <= clock',
        node.name + '.' + e.name + '.en <= ' + emit(e.en),
        node.name + '.' + e.name + '.addr <= ' + emit(e.addr)
      ]),
      node.writers.flatMap(e => [
        node.name + '.' + e.name + '.clk <= clock',
        node.name + '.' + e.name + '.en <= ' + emit(e.en),
        node.name + '.' + e.name + '.addr <= ' + emit(e.addr),
        node.name + '.' + e.name + '.data <= ' + emit(e.data),
        node.name + '.' + e.name + '.mask <= ' + emit(e.mask)
      ])
    );
  return res.join('\n');
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
  res.push(node.name + '.arst <= arst');
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
  ) + (node.vec ? node.vec.map(e => '[' + e + ']').join('') : '');


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
  case 'node':
  case 'rega':
  case 'inst':
    return emitWhen(node);
  case 'assert':
  case 'assume':
  case 'cover':
    return [emit(node)];
  case 'skip':
    return ['skip'];
  case 'mem':
    return [emitMem(node)];
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
