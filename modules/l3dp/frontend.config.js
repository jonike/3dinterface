var webpack = require('webpack');

webpack({
    entry: './src/l3dp.ts',
    output: {
        libraryTarget: 'var',
        library: 'l3dp',
        filename: './bin/l3dp.js',
    },
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.js', '.json']
    },
    module: {
        loaders: [{
            test: /\.ts(x?)$/,
            loader: 'ts-loader'
        },
        {
            test: /\.json$/,
            loader: 'json-loader'
        }],
        exclude: /node_modules/
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
    devtool:'sourcemap',
    ts: {
        configFileName: './tsconfig-frontend.json',
        silent:true

    }
}, function(err, stats) {
    var log = stats.toString('errors-only');
    if (log.length !== 0)
        process.stderr.write(log + '\n');
});
