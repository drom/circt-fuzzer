'use strict';

const chai = require('chai');

const emit = require('../lib/circt-emit.js');

const expect = chai.expect;

describe('circt-emit', () => {
  it('hw', () => {
    expect(emit({
      dial: 'HW',
      kind: 'HWModuleOp',
      name: 'top_mod',
      args: [{
        name: 'arg0',
        type: 'i',
        signed: true,
        width: 8
      }],
      results: [],
      body: [{
        dial: 'HW',
        kind: 'ConstantOp',
        name: 'a',
        value: 42n,
        type: 'i',
        width: 12
      }, {
        dial: 'Comb',
        kind: 'AddOp',
        name: 'b',
        args: [
          {name: 'a'},
          {name: 'a'}
        ],
        type: 'i',
        signed: false,
        width: 12
      }]
    })).to.eq(
`hw.module @top_mod(%arg0: si8) -> () {
  %a = hw.constant 42 : i12
  %b = comb.add %a, %a : i12
}`
    );
  });
});

/* eslint-env mocha */
