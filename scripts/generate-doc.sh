#!/bin/bash

cd ..
typedoc \
    --out doc \
    --mode file \
    --module commonjs \
    --name 3dinterface \
    modules/server/typings/typings/*.d.ts \
    custom_typings/*.d.ts \
    custom_typings/*/*.d.ts \
    modules/mth/quickhull3d.d.ts \
\
    modules/config/config.ts \
    modules/mth/src/mth.ts \
    modules/l3d/src/l3d.ts \
    modules/l3dp/src/l3dp.ts \
    modules/server/src/geo/Geo.ts
