'use strict';

const rnd = require('random-js');

const dontTouch = (circuit, opt, mt) => {
  // console.log(circuit);
  let res = [];
  circuit.map(mod => {
    mod.body.map(item => {
      if (['wire', 'reg', 'rega', 'regr'].includes(item.type) && rnd.bool()(mt)) {
        const target = '~top_mod|' + mod.name + '>' + item.name;
        res.push({class: 'firrtl.transforms.DontTouchAnnotation', target});
      }
    });
  });
  return '[\n' + res.map(e => JSON.stringify(e)).join(',\n') + '\n]\n';

};

module.exports = dontTouch;
