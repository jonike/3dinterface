var webpack = require('webpack');
var path = require('path');

var tsOptions = JSON.stringify({
    configFileName:'./tsconfig.json',
    silent:true
});

webpack({
    entry: './config.ts',
    output: {
        libraryTarget: 'var',
        library: 'config',
        filename: './bin/config.js',
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
