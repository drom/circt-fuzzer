'use strict';

const rnd = require('random-js');

module.exports = mt => ['wire', 'reg', 'output'][rnd.integer(0, 2)(mt)];
