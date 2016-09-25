#!/bin/bash
curr_dir=$(pwd)

echo $curr_dir

for f in `ls src/main/webapp/ | grep -v WEB `
do
rm -rf target/confidence-melhorcambio-1-0-0-alpha-3/$f
ln -fs $curr_dir/src/main/webapp/$f $curr_dir/target/confidence-melhorcambio-1-0-0-alpha-3/$f
done;

