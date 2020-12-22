#!/bin/bash

VFILE1=top_mod.v
VFILE2=top_mod_m.v
DUT=top_mod

for (( s=1; s<=10000; s++ ))
do
  echo $s
  ./bin/cli.js \
    --seed $s \
    --max-width 10 \
    --max-inputs 10 \
    --max-ops 10 \
    fir > top_mod.fir
    # -L false \

  echo "1-old"
  ./firrtl-1.4.0 -i top_mod.fir

  echo "2-old-verilator"
  verilator --lint-only $VFILE1

  echo "3-new"
  ../../llvm/circt/build/bin/firtool \
    top_mod.fir \
    --lower-to-rtl \
    --verilog -o=$VFILE2

  echo "4-new-verilator"
  verilator --lint-only $VFILE2
    # -Wno-WIDTH \


  echo "5-yosys"
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
done
