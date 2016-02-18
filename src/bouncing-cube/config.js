var path = require('path');

module.exports = {
    entry: path.join(__dirname, 'src/main.ts'),
    output: {
        filename: path.join(__dirname, '../server/build/static/js/bouncing.min.js'),
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
        'l3d':'l3d'
    },
    devtool:'sourcemap',
    ts: {
        configFileName:path.join(__dirname, './tsconfig.json')
    }
};