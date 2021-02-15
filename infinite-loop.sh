#!/bin/bash

VFILE1=top_mod.v
VFILE2=top_mod_m.v
DUT=top_mod

echo "
<script src=\"main.js\"></script>
<style>
table { width: 100%; border-collapse: collapse; }
table, th, td { border: 1px solid black; }
th, td { padding: 6px; }
td { white-space: pre; }
</style>
<table id=\"log\">
<row>
<th>seed</th>
<th>firrtl</th>
<th>lint</th>
<th>mlir</th>
<th>lint</th>
<th>yosys</th>
</row>"

for (( s=1; s<=10000; s++ ))
do
  echo "<tr>"

  echo "<td>$s</td>"
  ./bin/cli.js \
    --seed $s \
    --max-width 20 \
    --max-inputs 20 \
    --max-ops 50 \
    fir > top_mod.fir
    # -L false \

  echo "<td>"
  ./firrtl-1.4.0 -i top_mod.fir
  echo "</td>"

  echo "<td>"
  verilator --lint-only $VFILE1
  echo "</td>"

  echo "<td>"
  ../../llvm/circt/build/bin/firtool \
    top_mod.fir \
    --lower-to-rtl \
    --verilog -o=$VFILE2
  echo "</td>"

  echo "<td>"
  verilator --lint-only $VFILE2
  echo "</td>"


  echo "<td>"
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
  echo "</td>"
  echo "</tr>"
done
