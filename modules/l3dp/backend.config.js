var fs = require('fs');
var webpack = require('webpack');
var path = require('path');

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
    entry: path.join(__dirname, 'src/l3dp.ts'),
    output: {
        filename: path.join(__dirname, './build/l3dp.js'),
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
        configFileName: './tsconfig-backend.json',
        silent:true

    }
}, function(err, stats) {
    if (err !== null)
        process.stderr.write(stats.toString('errors-only') + '\n');
});

