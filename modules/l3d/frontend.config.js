var webpack = require('webpack');
var path = require('path');

var tsOptions = JSON.stringify({
    configFileName:'./tsconfig-frontend.json',
    silent:true
});

webpack({
    entry: './src/l3d.ts',
    output: {
        libraryTarget: 'var',
        library: 'l3d',
        filename: './bin/l3d.js',
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
        three : 'THREE',
        'socket.io': 'io',
        'socket.io-client':'io',
        'mth':'mth'
    },
    plugins: [
        require('webpack-fail-plugin')
    ],
    devtool:'sourcemap',
    node: {
        fs: "empty",
        child_process: "empty"
    }
}, function(err, stats) {
    var log = stats.toString('errors-only');
    if (log.length !== 0)
        process.stderr.write(log + '\n');
});
