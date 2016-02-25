var webpack = require('webpack');
var path = require('path');

webpack({
    entry: './src/l3d.ts',
    output: {
        libraryTarget: 'var',
        library: 'l3d',
        filename: path.join(__dirname, '../server/lib/static/js/l3d.js'),
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
        'mth':'mth'
    },
    plugins: [
        require('webpack-fail-plugin')
    ],
    devtool:'sourcemap',
    ts: {
        configFileName:'./tsconfig-frontend.json',
        silent:true

    }
}, function(err, stats) {
    if (err !== null)
        process.stderr.write(stats.toString('errors-only'));
});
