var webpack = require('webpack');
var path = require('path');

webpack({
    entry: './config.ts',
    output: {
        libraryTarget: 'var',
        library: 'config',
        filename: path.join(__dirname, '../server/build/static/js/config.js'),
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

    },
    plugins: [
        require('webpack-fail-plugin')
    ],
    devtool:'sourcemap',
    ts: {
        configFileName:'./tsconfig.json',
        silent:true

    }
}, function(err, stats) {
    if (err !== null)
        process.stderr.write(stats.toString('errors-only') + '\n');
});
