'use strict';

const rnd = require('random-js');

const wireRegOutput = (mt, width) => {
  const idx = rnd.integer(0, 3)(mt);
  if ((idx === 0) && (width === 0)) {
    return 'reg';
  }
  return ['regr', 'reg', 'wire', 'output'][idx];
};


module.exports = wireRegOutput;
