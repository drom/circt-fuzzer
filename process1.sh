#!/bin/bash

set -e

FIRRTL=./firrtl-1.5-SNAPSHOT
FIRTOOL=../../llvm/circt/build/bin/firtool
YOSYS=../../YosysHQ/yosys/yosys

INPUT=a_top_mod.fir
TOP=top_mod

# command line arguments
while [[ $# -gt 1 ]]
do
key="$1"

case $key in
  -i|--input)
  INPUT="$2"
  shift
  ;;
  -t|--top)
  TOP="$2"
  shift
  ;;
  *)
  ;;
esac
shift
done

VFILE1=${INPUT}.sfc.v
VFILE2=${INPUT}.mfc.v
VFILE3=${INPUT}.mfc2.v

echo "firrtl"
$FIRRTL \
  --dont-fold div \
  -i $INPUT \
  -X verilog \
  -o $VFILE1

# --annotation-file ${INPUT}.json \
# valgrind -q \
# --lowering-options=disallowPackedArrays,emittedLineLength=8192
# --lower-to-hw
# --infer-widths
# --imconstprop
echo "firtool"
$FIRTOOL \
$INPUT \
  --verilog \
  --lowering-options=disallowPackedArrays\
,noAlwaysComb\
,disallowLocalVariables\
,emittedLineLength=8192 \
  -o=$VFILE2
#  --mlir-timing
# --lowering-options=noAlwaysFF
# --annotation-file=${INPUT}.json
# --expand-whens

# valgrind -q \
echo "firtool"
$FIRTOOL \
$INPUT \
  --lower-to-hw \
  --lowering-options=disallowPackedArrays\
,noAlwaysComb\
,disallowLocalVariables\
,emittedLineLength=8192 \
  --infer-widths \
  --mlir-timing \
  --verilog -o=$VFILE3
  # --imconstprop=0 \
  # --lowering-options=noAlwaysFF \
# --expand-whens \


echo "firrtl lint"
verilator \
  --top-module $TOP \
  --Wno-WIDTH \
  --Wno-MULTIDRIVEN \
  --lint-only \
  $VFILE1

echo "firtool lint"
verilator \
  --top-module $TOP \
  --Wno-LATCH \
  --Wno-MULTIDRIVEN \
  --lint-only \
  $VFILE2

echo "yosys 0"
$YOSYS -q -l yosys.log -p "
  read_verilog $VFILE1
  rename $TOP top1
  proc
  memory
  flatten top1
  hierarchy -top top1
  async2sync
  read_verilog $VFILE2
  rename $TOP top2
  proc
  memory
  flatten top2
  equiv_make top1 top2 equiv
  hierarchy -top equiv
  async2sync
  clean -purge
  equiv_simple -short
  equiv_induct -seq 50
  equiv_status -assert
"

echo "yosys 1"
$YOSYS -q -p "
  read_verilog $VFILE1
  rename $TOP top1
  proc
  memory
  flatten top1
  hierarchy -top top1
  async2sync
  read_verilog $VFILE2
  rename $TOP top2
  proc
  memory
  flatten top2
  equiv_make top1 top2 equiv
  hierarchy -top equiv
  async2sync
  clean -purge
  equiv_simple -short -undef
  equiv_induct -seq 50
  equiv_status -assert
"

echo "yosys 2"
$YOSYS -q -p "
  read_verilog $VFILE1
  rename $TOP top1
  proc
  memory
  flatten top1
  hierarchy -top top1
  async2sync
  read_verilog $VFILE2
  rename $TOP top2
  proc
  memory
  flatten top2
  equiv_make top1 top2 equiv
  hierarchy -top equiv
  async2sync
  clean -purge
  equiv_simple -short
  equiv_induct -undef -seq 50
  equiv_status -assert
"

echo "yosys 3"
$YOSYS -q -p "
  read_verilog -sv  $VFILE1
  rename $TOP top1
  proc
  memory
  flatten top1
  hierarchy -top top1
  async2sync
  read_verilog -sv  $VFILE2
  rename $TOP top2
  proc
  memory
  flatten top2
  clean -purge
  miter -equiv -make_assert -flatten top1 top2 miter
  sat -verify -prove-asserts -enable_undef -show-public miter
"

echo "yosys 4"
$YOSYS -q -p "
  read_verilog -sv  $VFILE1
  rename $TOP top1
  proc
  memory
  flatten top1
  hierarchy -top top1
  async2sync
  read_verilog -sv  $VFILE2
  rename $TOP top2
  proc
  memory
  flatten top2
  async2sync
  clean -purge
  miter -equiv -make_assert -flatten top1 top2 miter
  sat -verify -prove-asserts -enable_undef -max_undef -show-public miter
"
