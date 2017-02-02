var webpack = require('webpack');

var tsOptions = JSON.stringify({
    configFileName:'./tsconfig-frontend.json',
    silent:true
});

webpack({
    entry: './src/l3dp.ts',
    output: {
        libraryTarget: 'var',
        library: 'l3dp',
        filename: 'bin/l3dp.js',
    },
    resolve: {
        extensions: ['.webpack.js', '.web.js', '.ts', '.js', '.json']
    },
    module: {
        rules: [{
            test: /\.ts(x?)$/,
            use: 'ts-loader?' + tsOptions,
            exclude: /node_modules/
        },
        {
            test: /\.json$/,
            use: 'json-loader',
            exclude: /node_modules/
        }]
    },
    externals: {
        three : 'THREE',
        'socket.io': 'io',
        'socket.io-client':'io',
        'stats':'Stats',
        'config':'config',
        'jQuery':'$',
        'l3d':'l3d'
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
