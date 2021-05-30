#!/usr/bin/env node
'use strict';

const { writeFile, mkdir } = require('fs/promises');
const { spawn } = require('child_process');

const circtPath = '../../llvm/circt/';

const expander = (obj, pat, acc) =>
  Object.keys(obj).reduce((res, e) => {
    res[e] = pat + '/' + e + '/' + (obj[e] || e);
    return res;
  }, acc);

const mlirDialecto = {
  Affine: 'IR/AffineOps',
  AMX: 0,
  ArmNeon: 0,
  ArmSVE: 0,
  Async: 'IR/AsyncOps',
  Complex: 'IR/ComplexOps',
  DLTI: 0,
  GPU: 'GPUOps',
  Linalg: 'IR/LinalgOps',
  LLVMIR: 'LLVMOps',
  Math: 'IR/MathOps',
  MemRef: 'IR/MemRefOps',
  // OpenACC: 'OpenACCOps',
  // OpenMP: 'OpenMPOps',
  PDL: 'IR/PDLOps',
  PDLInterp: 'IR/PDLInterpOps',
  Quant: 'QuantOps',
  SCF: 'SCFOps',
  // SDBM: 'IR/SDBMOps',
  Shape: 'IR/ShapeOps',
  SparseTensor: 'IR/SparseTensorOps',
  SPIRV: 'IR/SPIRVOps',
  StandardOps: 'IR/StandardOpsBase',
  Tensor: 'IR/TensorOps',
  Tosa: 'IR/TosaOps',
  Vector: 'VectorOps',
  X86Vector: 0
};

const circtDialecto = {
  Comb: 0,
  ESI: 0,
  FIRRTL: 0,
  Handshake: 'HandshakeOps',
  HW: 0,
  // LLHD: 0,
  MSFT: 0,
  Seq: 0,
  StaticLogic: 0,
  SV: 0
};

(async () => {

  await mkdir('dialects', {recursive: true});

  const dialecto = expander(circtDialecto, 'include/circt/Dialect',
    expander(mlirDialecto, 'llvm/mlir/include/mlir/Dialect', {})
  );
  Object.keys(dialecto).map(e =>
    spawn(circtPath + 'llvm/build/bin/llvm-tblgen', [
      '-I', circtPath + 'llvm/mlir/include/',
      '-I', circtPath + 'include/',
      '-I', circtPath + 'include/circt/Dialect/' + e + '/',
      '--dump-json',
      circtPath + dialecto[e] + '.td',
      '-o', './dialects/' + e + '.json'
    ], {stdio: 'inherit'}));

  writeFile('./dialects/index.js', [
    `'use strict';`,
    ...Object.keys(dialecto).map(e => `exports.${e} = require('./${e}.json');`)
  ].join('\n'));

})();
