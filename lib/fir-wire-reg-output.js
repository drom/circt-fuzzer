'use strict';

const rnd = require('random-js');

const wireRegOutput = (mt, width) => {
  const idx = rnd.integer(0, 4)(mt);
  if (((idx === 0) || (idx === 1)) && (width === 0)) {
    return 'reg';
  }
  return ['regr', 'rega', 'reg', 'wire', 'output'][idx];
};


module.exports = wireRegOutput;
