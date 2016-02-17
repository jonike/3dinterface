var gulp = require('gulp');
var shell = require('gulp-shell');
var changed = require('gulp-changed');
var webpack = require('webpack');
var rimraf = require('rimraf');
var path = require('path');
var mkdirp = require('mkdirp');
var merge = require('merge-dirs').default;
var exec = require('child_process').exec;
var task = require('./create-task.js')(__filename);

var root = path.join(__dirname, '..');
var rootApps = path.join(root, 'js/apps');
var rootBuildApps = path.join(root, 'build/server/static/js/proto.min.js');

var frontendConfig = {
    entry: path.join(rootApps, 'proto', 'main.ts'),
    output: {
        filename: rootBuildApps,
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
        L3D : 'L3D',
        l3dp:'l3dp',
        'socket.io': 'io',
        'socket.io-client':'io',
        stats : 'Stats'
    },
    devtool:'sourcemap',
    ts: {
        configFileName: path.join(rootApps, 'proto', 'tsconfig.json')
    }
};

task('prepare-proto', ['build-l3dp-backend'], path.join(rootApps, 'proto') + "/**", function(done) {

    exec('npm install ../../build/l3dp/', {cwd:rootApps}, done)
        .stdout.on('data', (data)=>process.stdout.write(data));

});

task('build-proto', ['prepare-apps', 'prepare-proto', 'build-l3dp-frontend'], path.join(rootApps, 'proto') + "/**", function(done) {

    process.chdir(root);
    webpack(frontendConfig).run(function(err, stats) {
        rimraf('./proto', {}, function() {
            if (err) {
                console.log('Error ', err);
                done(err);
            } else {
                console.log(stats.toString());
                done();
            }
        });
    });

});