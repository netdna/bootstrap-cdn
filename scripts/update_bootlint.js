#!/usr/bin/env node

/* eslint-env shelljs */

'use strict';

require('shelljs/global');
var https       = require('https');
var fs          = require('fs');
var path        = require('path');

var version     = process.argv[2];

// strip leading 'v' if present
version = version.replace(/^v/, '');


var basedir     = path.join(__dirname, '..');
var bootlintDir = path.join(basedir, 'public', 'bootlint', version);
var UGLIFYJS    = path.join(basedir, 'node_modules/.bin/uglifyjs');

if (!version) {
    echo('Valid Bootlint version required.');
    process.exit(1);
}

if (test('-d', bootlintDir)) {
    echo('Bootlint version already found.');
    process.exit(1);
}

https.get('https://raw.githubusercontent.com/twbs/bootlint/v' + version + '/dist/browser/bootlint.js', function (res) {
    var statusCode = res.statusCode;

    if (statusCode !== 200) {
        console.log(new Error('Request Failed.\nStatus Code: ' + statusCode).message);
        res.resume();
        return;
    }

    mkdir(bootlintDir);
    pushd(bootlintDir);

    var targetFile = path.join(bootlintDir, 'bootlint.js');
    var targetMinFile = path.join(bootlintDir, 'bootlint.min.js');
    var file = fs.createWriteStream(targetFile);

    res.pipe(file);

    res.on('end', function () {
        file.close();

        exec(UGLIFYJS + ' ' + targetFile + ' -o ' + targetMinFile +
          ' --compress --source-map ' + targetMinFile + '.map' +
          ' --comments "/(?:^!|@(?:license|preserve|cc_on))/"');

        cd('..');

        if (process.platform === 'win32') {
            fs.writeFileSync('latest', version, 'utf8');
        } else {
            rm('-f', 'latest');
            ln('-sf', version, 'latest');
        }

        popd();

        echo('\nDo not forget to update "config/_config.yml!"');
    });
});