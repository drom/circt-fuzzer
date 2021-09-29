'use strict';

const rnd = require('random-js');

const getClockName = (mt, opt) =>
  'clock' + rnd.integer(0, opt.numClocks - 1)(mt);

module.exports = getClockName;
