#!/bin/bash

VFILE1=top_mod.v
VFILE2=top_mod_m.v
DUT=top_mod

./firrtl-1.4.0 -i top_mod.fir

verilator --lint-only $VFILE1

../../llvm/circt/build/bin/firtool \
  top_mod.fir \
  --lower-to-rtl \
  --verilog -o=$VFILE2

verilator --lint-only $VFILE2

../../YosysHQ/yosys/yosys -q -p "
  read_verilog $VFILE1
  rename $DUT top1
  proc
  memory
  flatten top1
  hierarchy -top top1
  read_verilog $VFILE2
  rename $DUT top2
  proc
  memory
  flatten top2
  equiv_make top1 top2 equiv
  hierarchy -top equiv
  clean -purge
  equiv_simple -short
  equiv_induct
  equiv_status -assert
"
