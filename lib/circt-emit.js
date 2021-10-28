'use strict';

const indent = arr => arr.map(e => '  ' + e);

const emitType = n => {
  if (n.type === undefined) {
    return '';
  }
  if (n.type === 'i') {
    return (n.signed ? 's' : '') + n.type + n.width;
  }
  return n.type;
};

const emitAttrDict = n => {
  if (typeof n.attrDict === 'object') {
    return '{ ' +
    Object
      .keys(n.attrDict)
      .map(key => key + ' = "' + n.attrDict[key] + '"')
      .join(',') +
    ' } ';
  }
  return '';
};


const emitFunctionalType = (a, b) =>
  `(${emitType(a)}) -> (${emitType(b)})`;

const emitNamesTypes = names =>
  names
    .map(n => '%' + n.name + (n.type ? ': ' + emitType(n) : ''))
    .join(', ');

const emitNames = names =>
  names.map(n => '%' + n.name).join(', ');

const emitTypes = names =>
  names.map(n => emitType(n)).join(', ');

const emitResults = results =>
  results.map(e => e.name + ': ' + emitType(e)).join(', ');

const emito = {
  HW: {
    HWModuleOp: n => [
      `hw.module @${n.name}(${emitNamesTypes(n.args)}) -> (${emitResults(n.results)}) {`,
      ...indent(n.body.map(e => emito[e.dial][e.kind](e))),
      '}'
    ].join('\n'),
    ConstantOp: n =>
      `%${n.name} = hw.constant ${n.value} : ${emitType(n)}`,
    OutputOp: n =>
      `hw.output %${n.name} : ${emitType(n)}`
  },
  Comb: {}
};

'Add And Or Xor Mul'.split(/\s+/).map(op => {
  emito.Comb[op + 'Op'] = n =>
    `%${n.name} = comb.${op.toLocaleLowerCase()} ${emitNames(n.inputs)} ${emitAttrDict(n)}: ${emitType(n)}`;
});

'Concat'.split(/\s+/).map(op => {
  emito.Comb[op + 'Op'] = n =>
    `%${n.name} = comb.${op.toLocaleLowerCase()} ${emitNames(n.inputs)} : ${emitTypes(n.inputs)}`;
});

'Extract'.split(/\s+/).map(op => {
  emito.Comb[op + 'Op'] = n =>
    `%${n.result.name} = comb.${op.toLocaleLowerCase()} ${emitNames([n.input])} from ${n.lowBit} : ${emitFunctionalType(n.input, n.result)}`;
});

'ICmp'.split(/\s+/).map(op => {
  emito.Comb[op + 'Op'] = n =>
    `%${n.name} = comb.${op.toLocaleLowerCase()} ${n.predicate} ${emitNames([n.lhs])}, ${emitNames([n.rhs])} : ${emitType(n.lhs)}`;
});

emito.Comb.SExtOp = n =>
  `%${n.name} = comb.sext ${emitNames([n.input])} ${emitAttrDict(n)}: ${emitFunctionalType(n.input, n.result)}`;

emito.Comb.ParityOp = n =>
  `%${n.name} = comb.parity ${emitNames([n.input])} : ${emitType(n)}`;

const emit = n => {
  return emito[n.dial][n.kind](n);
};

module.exports = emit;
