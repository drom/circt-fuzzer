'use strict';

const chai = require('chai');
const rnd = require('random-js');

const expect = chai.expect;

const lib = require('../lib/index.js');

const opt1 = {
  m: 20,
  O: 1000,
  I: 100,
  bundles: true,
  vectors: true,
  instances: true,
  mems: true,
  ordered: true,
  verif: false,
  fsms: true,
  z: true,
  L: true,
  o: 'top_mod.fir',
  unsized: true,
  n: true,
  numClocks: 2,
  // hier options
  numMods: 5
};

describe('firrtl', () => {

  it('lib is object', async () => {
    expect(lib).to.be.an('object');
  });

  it('genCircuit is function', async () => {
    expect(lib.genCircuit).to.be.a('function');
  });

  it('firOutput is function', async () => {
    expect(lib.firOutput).to.be.a('function');
  });

  it('genCircuit output is array', async () => {
    const mt = rnd.MersenneTwister19937.seed(42);
    const circuit = lib.genCircuit(mt, opt1);
    expect(circuit).to.be.an('array');
  });

  it('firOutput output is string', async () => {
    const mt = rnd.MersenneTwister19937.seed(42);
    const circuit = lib.genCircuit(mt, opt1);
    const res = lib.firOutput(circuit, opt1);
    expect(res).to.be.a('string');
  });

});

/* eslint-env mocha */
