'use strict';

const indent = arr => arr.map(e => '  ' + e);

const emitType = n =>
  n.type
    ? ': ' + (n.signed ? 's' : '') + n.type + n.width
    : '';

const emitArgs = args =>
  args
    .map(e => '%' + e.name + emitType(e))
    .join(', ');

const emitResults = results =>
  results
    .map(e => e.name + emitType(e))
    .join(', ');

const emito = {
  HW: {
    HWModuleOp: n => [
      `hw.module @${n.name}(${emitArgs(n.args)}) -> (${emitResults(n.results)}) {`,
      ...indent(n.body.map(e => emito[e.dial][e.kind](e))),
      '}'
    ].join('\n'),
    ConstantOp: n =>
      `%${n.name} = hw.constant ${n.value} ${emitType(n)}`
  },
  Comb: {
    AddOp: n =>
      `%${n.name} = comb.add ${emitArgs(n.args)} ${emitType(n)}`
  }
};

const emit = n => {
  return emito[n.dial][n.kind](n);
};

module.exports = emit;
