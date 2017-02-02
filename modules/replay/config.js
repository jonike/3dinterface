var webpack = require('webpack');
var path = require('path');

var tsOptions = JSON.stringify({
    configFileName:'./tsconfig.json',
    silent:true
});

webpack({
    entry: path.join(__dirname, './main.ts'),
    output: {
        libraryTarget: 'var',
        library: 'config',
        filename: './bin/replay.js',
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
        "config":"config",
        "l3d":"l3d",
        "l3dp":"l3dp",
        "three":"THREE",
        "Stats":"Stats"
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
