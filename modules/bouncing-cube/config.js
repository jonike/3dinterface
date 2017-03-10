var webpack = require('webpack');
var path = require('path');

var tsOptions = JSON.stringify({
    configFileName:path.join(__dirname, './tsconfig.json'),
    silent:true
});

webpack({
    entry: path.join(__dirname, 'src/main.ts'),
    output: {
        filename: './bin/bouncing.min.js',
    },
    resolve: {
        extensions: ['.webpack.js', '.web.js', '.ts', '.js', '.json']
    },
    module: {
        loaders: [{
            test: /\.ts(x?)$/,
            loader: 'ts-loader?' + tsOptions
        },
        {
            test: /\.json$/,
            loader: 'json-loader'
        }]
    },
    externals: {
        three : 'THREE',
        'socket.io': 'io',
        'socket.io-client':'io',
        'l3d':'l3d'
    },
    devtool:'sourcemap',
    plugins: [
        require('webpack-fail-plugin')
    ]

}, function(err, stats) {
    var log = stats.toString('errors-only');
    if (log.length !== 0)
        process.stderr.write(log + '\n');
});
