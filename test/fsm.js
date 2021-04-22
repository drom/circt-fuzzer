'use strict';

const chai = require('chai');

const expect = chai.expect;

const genFsm = require('../lib/fir-gen-fsm.js');
const rndDigraph = require('../lib/rnd-digraph.js');

describe('fsm', () => {

  it('genFsm is function', async () => {
    expect(genFsm).to.be.a('function');
  });

  it('rndDigraph is function', async () => {
    expect(rndDigraph).to.be.a('function');
  });

});

/* eslint-env mocha */
