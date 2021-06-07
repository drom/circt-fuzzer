'use strict';

const rnd = require('random-js');

const wireRegOutput = (mt, width) => {
  const idx = rnd.integer(0, 1)(mt);
  if (((idx === 2) || (idx === 3)) && (width === 0)) {
    return 'reg';
  }
  return ['wire', 'output', 'regr', 'rega', 'reg'][idx] || 'wire';
};


module.exports = wireRegOutput;
