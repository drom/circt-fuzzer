'use strict';

const json5 = require('json5');
const genBody = require('./fir-gen-body.js');
const firOutput = require('../lib/fir-output.js');
const renderFir = require('logidrom/lib/render-fir.js');
const onml = require('onml');

global.Fuzzer = divName => {
  const content = (typeof divName === 'string')
    ? document.getElementById(divName)
    : divName;

  const opt = {
    // seed: 100,
    O: 30,
    I: 30,
    z: false,
    m: 30,
    L: true
  };

  const nodes = genBody(opt);
  console.log(json5.stringify(nodes, null, 2));
  const ml = renderFir(nodes);
  console.log(firOutput(nodes, opt));
  ml[1].class = 'panel';
  let svg;
  try {
    svg = onml.stringify(ml);
    content.innerHTML = svg;
  } catch (err) {
    console.log(ml);
  }
};

/* eslint-env browser */
