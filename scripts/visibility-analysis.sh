#!/bin/bash
cd ../modules/analysis/bin

prefetchs=(NV-PN NV-PN V-PD)
options=("" "--HPR" "")

for scene in `seq 1 3`; do
    for i in `seq 0 $((${#prefetchs[@]}-1))`; do
        node visibility-analysis.js -v -i img -s $scene -p ${prefetchs[$i]} ${options[$i]}
    done
done
