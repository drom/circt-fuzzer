'use strict';

const chai = require('chai');

const emit = require('../lib/circt-emit.js');
const circtCompile = require('../lib/circt-compile.js');

const expect = chai.expect;

const ast = {
  dial: 'HW', kind: 'HWModuleOp', name: 'test1',
  args: [
    {name: 'arg0', type: 'i', signed: false, width: 3},
    {name: 'arg1', type: 'i', signed: true, width: 8},
    {name: 'arg2', type: '!hw.array<1000xi8>'}
  ],
  results: [
    {name: 'result', type: 'i', width: 50}
  ],
  body: [{
    dial: 'HW', kind: 'ConstantOp', name: 'a',
    value: 42,
    type: 'i', width: 12
  }, {
    dial: 'Comb', kind: 'AddOp', name: 'b',
    type: 'i',
    width: 12,
    attrDict: {name: 'foo'},
    inputs: [
      {name: 'a'},
      {name: 'a'}
    ]
  }, {
    dial: 'Comb', kind: 'MulOp', name: 'c',
    type: 'i', width: 12,
    inputs: [
      {name: 'a'},
      {name: 'b'}
    ]
  }, {
    dial: 'Comb', kind: 'SExtOp', name: 'd',
    input:  {name: 'arg0', type: 'i', signed: false, width: 3},
    result: {type: 'i', signed: false, width: 7},
    attrDict: {name: 'bar'}
  }, {
    dial: 'Comb', kind: 'ConcatOp', name: 'conc1',
    inputs: [
      {name: 'a', type: 'i', signed: false, width: 12}
    ]        
  }, {
    dial: 'Comb', kind: 'ParityOp', name: 'parity1',
    type: 'i', width: 12,
    input: {name: 'conc1'}
  }, {
    dial: 'Comb', kind: 'ConcatOp', name: 'result',
    inputs: [
      {name: 'conc1', type: 'i', width: 12},
      {name: 'b', type: 'i', width: 12},
      {name: 'c', type: 'i', width: 12},
      {name: 'd', type: 'i', width: 7},
      {name: 'd', type: 'i', width: 7}
    ]
  }, {
    dial: 'Comb', kind: 'ExtractOp',
    input: {name: 'result', type: 'i', width: 50},
    result: {name: 'small1', type: 'i', width: 19},
    lowBit: 4
  }, {
    dial: 'Comb', kind: 'ExtractOp',
    input: {name: 'result', type: 'i', width: 50},
    result: {name: 'small2', type: 'i', width: 19},
    lowBit: 31
  }, {
    dial: 'Comb', kind: 'AddOp', name: 'add',
    type: 'i', width: 19,
    inputs: [
      {name: 'small1'},
      {name: 'small2'}
    ]
  }, ...('eq,eq neq,ne lt,slt ult,ult leq,sle uleq,ule gt,sgt ugt,ugt geq,sge ugeq,uge'.split(/\s+/)
    .map(row => {
      const [name, predicate] = row.split(',');
      return {
        dial: 'Comb', kind: 'ICmpOp', name,
        predicate,
        lhs: {name: 'small1', type: 'i', width: 19},
        rhs: {name: 'small2'}
      };
    })
  ), {
    dial: 'HW', kind: 'OutputOp', name: 'result', type: 'i', width: 50
  }]
};
  
const mlir = (
`hw.module @test1(%arg0: i3, %arg1: si8, %arg2: !hw.array<1000xi8>) -> (result: i50) {
  %a = hw.constant 42 : i12
  %b = comb.add %a, %a { name = "foo" } : i12
  %c = comb.mul %a, %b : i12
  %d = comb.sext %arg0 { name = "bar" } : (i3) -> (i7)
  %conc1 = comb.concat %a : i12
  %parity1 = comb.parity %conc1 : i12
  %result = comb.concat %conc1, %b, %c, %d, %d : i12, i12, i12, i7, i7
  %small1 = comb.extract %result from 4 : (i50) -> (i19)
  %small2 = comb.extract %result from 31 : (i50) -> (i19)
  %add = comb.add %small1, %small2 : i19
  %eq = comb.icmp eq %small1, %small2 : i19
  %neq = comb.icmp ne %small1, %small2 : i19
  %lt = comb.icmp slt %small1, %small2 : i19
  %ult = comb.icmp ult %small1, %small2 : i19
  %leq = comb.icmp sle %small1, %small2 : i19
  %uleq = comb.icmp ule %small1, %small2 : i19
  %gt = comb.icmp sgt %small1, %small2 : i19
  %ugt = comb.icmp ugt %small1, %small2 : i19
  %geq = comb.icmp sge %small1, %small2 : i19
  %ugeq = comb.icmp uge %small1, %small2 : i19
  hw.output %result : i50
}`
);

const verilog = (
`module test1(\t// <stdin>:1:1
  input  [2:0]        arg0,
  input  [7:0]        arg1,
  input  [999:0][7:0] arg2,
  output [49:0]       result);

  wire _T = arg0[2];\t// <stdin>:8:13
  wire _T_0 = arg0[2];\t// <stdin>:8:13
  assign result = {36'h2A054DC8, _T, _T, _T, _T, arg0, _T_0, _T_0, _T_0, _T_0, arg0};\t// <stdin>:8:13, :22:3
endmodule

`
);

describe('circt-emit', () => {
  it('hw', async () => {
    expect(emit(ast)).to.eq(mlir);
    expect(await circtCompile(mlir)).to.eq(verilog);
  });
});

/* eslint-env mocha */
