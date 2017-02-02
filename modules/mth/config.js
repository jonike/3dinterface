var webpack = require('webpack');
var path = require('path');

var tsOptions = JSON.stringify({
    configFileName:'./tsconfig.json',
    silent:true
});

webpack({
    entry: './src/mth.ts',
    output: {
        libraryTarget: 'var',
        library: 'mth',
        filename: './bin/mth.js',
    },
    resolve: {
        extensions: ['.webpack.js', '.web.js', '.ts', '.js', '.json']
    },
    module: {
        loaders: [{
            test: /\.ts(x?)$/,
            use: 'ts-loader?' + tsOptions
        },
        {
            test: /\.json$/,
            use: 'json-loader'
        }]
    },
    externals: {
        three : 'THREE'
    },
    plugins: [
        require('webpack-fail-plugin')
    ],
    devtool:'sourcemap'

}, function(err, stats) {
    var log = stats.toString('errors-only');
    if (log.length !== 0)
        process.stderr.write(log + '\n');
});
