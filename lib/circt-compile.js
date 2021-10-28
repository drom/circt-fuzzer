'use strict';

const { spawn } = require('child_process');

const firTool = '../../llvm/circt/build/bin/firtool';

const circtCompile = async (str) => {
  const firtool = await spawn(firTool, [
    '--verilog',
    '--format=mlir'
  ], {stdio: 'pipe'});

  await firtool.stdin.end(str);

  for await (const err of firtool.stderr) {
    console.error(err.toString());
  }

  for await (const out of firtool.stdout) {
    return out.toString();
  }
  firtool.on('error', err => {
    console.log(err);
  });

};

module.exports = circtCompile;