'use strict';

const rnd = require('random-js');

const rndLiteral = (mt, width, signed) => {
  const min = signed ? -Math.pow(2, Math.min(width - 1, 52)) : 0;
  const max = Math.pow(2, Math.min(width - (signed ? 1 : 0), 52)) - 1;
  let value = rnd.integer(min, max)(mt);

  switch (rnd.integer(0, 3)(mt)) {
  case 0: value = '"b' + value.toString(2) + '"'; break;
  case 1: value = '"o' + value.toString(8) + '"'; break;
  case 2: value = '"h' + value.toString(16) + '"';
  }

  return {type: 'Int', width, signed, value};
};

module.exports = rndLiteral;
