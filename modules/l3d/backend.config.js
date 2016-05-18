var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

var nodeModules = {};
try {
    fs.readdirSync(path.join(__dirname, 'node_modules'))
    .filter(function(x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function(mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });
} catch (err) {
    // nodeModules will stay empty
}

webpack({

    // entry: path.join(__dirname, 'src', 'l3d.ts'),
    output: {
        filename: path.join(__dirname, 'lib', 'l3d.js'),
        libraryTarget: 'commonjs'
    },
    target: 'node',
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
    },
    module: {
        loaders: [
            // note that babel-loader is configured to run after ts-loader
        { test: /\.ts(x?)$/, loader: 'ts-loader' }
        ]
    },
    externals: nodeModules,
    plugins: [
        new webpack.BannerPlugin('require("source-map-support").install();',
                { raw: true, entryOnly: false }),
        require('webpack-fail-plugin')
    ],
    devtool:'sourcemap',
    ts: {
        configFileName: path.join(__dirname, 'tsconfig-backend.json'),
        silent:true

    }

}, function(err, stats) {
    var log = stats.toString('errors-only');
    if (log.length !== 0)
        process.stderr.write(log + '\n');
});
