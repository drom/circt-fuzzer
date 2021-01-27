'use strict';

const rnd = require('random-js');
const renderer = require('onml/renderer.js');
const renderFir = require('logidrom/lib/fir-render.js');

const genCircuit = require('./fir-gen-circuit.js');
const firOutput = require('./fir-output.js');

global.Fuzzer = divName => {

  const opt = {
    // seed: 100,
    O: 50,
    I: 10,
    z: true,
    m: 5,
    L: true
  };

  opt.seed = opt.seed || ((1000000 * Math.random()) |0);
  const mt = rnd.MersenneTwister19937.seed(opt.seed);

  const circuit = genCircuit(mt, opt);
  const res = firOutput(circuit, opt);
  console.log(res);

  const ml = renderFir(circuit);
  ml[1].class = 'panel';
  renderer(divName)(ml);
};

/* eslint-env browser */
