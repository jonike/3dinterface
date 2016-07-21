#!/usr/bin/bash
cd ../modules/analysis/bin

prefetchs=(NV-PN V-PD)

for scene in `seq 1 3`; do
    for prefetch in ${prefetchs[@]}; do
        node visibility-analysis.js -v -i img -s $scene -p $prefetch&
    done
done
