'use strict';

const assert = require('assert').strict;
const helpers = require('./test_helpers.js');

const config = helpers.getConfig();

function format(str, name) {
    return str.replace('SWATCH_NAME', name)
                .replace('SWATCH_VERSION', config.bootswatch4.version);
}

describe('bootswatch4', () => {
    const uri = helpers.runApp('bootswatch');
    let response = {};

    before((done) => {
        helpers.prefetch(uri, (res) => {
            response = res;
            done();
        });
    });

    it('works', (done) => {
        helpers.assert.itWorks(response.statusCode, done);
    });

    it('valid html', (done) => {
        helpers.assert.validHTML(response, done);
    });

    it('contains authors', (done) => {
        helpers.assert.authors(response, done);
    });

    it('has page header', (done) => {
        helpers.assert.pageHeader('Bootswatch 4', response, done);
    });

    config.bootswatch4.themes.forEach((theme) => {
        describe(theme.name, () => {
            const themeImage = format(config.bootswatch4.image, theme.name);
            const themeUri   = format(config.bootswatch4.bootstrap, theme.name);
            const themeSri   = theme.sri;

            it('has image', (done) => {
                assert.ok(response.body.includes(themeImage),
                    `Expects response body to include "${themeImage}"`);
                done();
            });

            ['html', 'pug', 'haml'].forEach((fmt) => {
                it(`has ${fmt}`, (done) => {
                    const str = helpers.css[fmt](themeUri, themeSri);

                    assert.ok(response.body.includes(str), `Expects response body to include "${str}"`);
                    done();
                });
            });
        });
    });
});
