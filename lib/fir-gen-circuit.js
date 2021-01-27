'use strict';

const rnd = require('random-js');

const genModule = require('./fir-gen-module.js');

const genCircuit = (mt, opt) => {
  const modules = [];
  const nModules = rnd.integer(1, 5)(mt);
  for (let i = 0; i < nModules; i++) {
    genModule(mt, opt, modules);
  }
  modules[modules.length - 1].name = 'top_mod';
  return modules;
};

module.exports = genCircuit;
