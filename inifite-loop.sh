#!/bin/bash
for (( s=1; s<=10000; s++ ))
do
  echo $s
  ./bin/cli.js -s $s fir > top_mod.fir
  ../../llvm/circt/build/bin/firtool \
    top_mod.fir \
    --lower-to-rtl \
    --verilog -o=top_mod.v
  verilator \
    --lint-only \
    top_mod.v
done

# -Wno-WIDTH \
