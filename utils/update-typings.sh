#!/bin/bash
for module in `find $(pwd)/../modules -maxdepth 3 -name "typings.json"`; do
    cd ${module%/*}
    for typing in `cat typings.json | jq '.globalDependencies' | jq '.[]' | tr -d '"'`; do
        typings install --save --global dt~`echo $typing | cut -d '/' -f 2 | cut -d '#' -f 1`
    done
done

