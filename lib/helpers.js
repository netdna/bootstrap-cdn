'use strict';

const fs = require('fs');
const path = require('path');
const semver = require('semver');
const sri = require('sri-toolbox');

const { app, files } = require('../config');

const PUBLIC_DIR = path.join(__dirname, '../public/');
const SRI_CACHE = {};

function capitalize(str) {
    if (typeof str !== 'string') {
        return '';
    }

    return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateSri(file, fromString) {
    if (typeof SRI_CACHE[file] === 'undefined') {
        file = fromString ? file : fs.readFileSync(file);

        SRI_CACHE[file] = sri.generate({ algorithms: ['sha384'] }, file);
    }

    return SRI_CACHE[file];
}

// This is used only in the templates
function getSri(file) {
    if (typeof SRI_CACHE[file] === 'undefined') {
        SRI_CACHE[file] = generateSri(path.join(PUBLIC_DIR, file));
    }

    return SRI_CACHE[file];
}

function generateDataJson() {
    const data = {
        timestamp: new Date().toISOString(),
        bootstrap: {},
        fontawesome: {}
    };

    files.bootstrap.forEach((bootstrap) => {
        const bootstrapVersion = bootstrap.version;

        if (semver.satisfies(semver.coerce(bootstrapVersion), '<4')) {
            data.bootstrap[bootstrapVersion] = {
                css: bootstrap.stylesheet,
                js: bootstrap.javascript
            };
        }
    });

    files['@fortawesome/fontawesome-free'].forEach((fontawesome) => {
        data.fontawesome[fontawesome.version] = fontawesome.stylesheet;
    });

    return data;
}

function getCurrentSiteurl(req) {
    let proto = req.get('x-forwarded-proto');

    if (typeof proto === 'undefined') {
        proto = req.protocol;
    }

    return `${proto}://${req.hostname}`;
}

function getPageTitle(pageTitle) {
    return `${pageTitle} · ${app.title_suffix}`;
}

function generateBodyClass(pathname) {
    if (pathname === '/') {
        return 'page-home'; // only for the homepage
    }

    // Remove any backslashes
    pathname = pathname.replace(/\//g, '');

    // Make the first letter lowercase
    pathname = pathname.charAt(0).toLowerCase() + pathname.slice(1);

    return `page-${pathname}`;
}

function selectedTheme(selected) {
    if (typeof selected === 'undefined' || selected === '') {
        return app.theme;
    }

    const theme = Number.parseInt(selected, 10);

    return theme === 0 || theme ?
        theme :
        app.theme;
}

function getTheme(selected) {
    const { themes } = files.bootswatch4;

    selected = selectedTheme(selected);

    return {
        uri: files.bootswatch4.bootstrap
            .replace('SWATCH_VERSION', files.bootswatch4.version)
            .replace('SWATCH_NAME', themes[selected].name),
        sri: themes[selected].sri
    };
}

function getThemeQuery(req) {
    const totalThemes = files.bootswatch4.themes.length;
    const query = Number.parseInt(req.query.theme, 10);

    // Safety checks
    if (Number.isNaN(query) || query < 0 || query >= totalThemes) {
        return '';
    }

    return String(query);
}

function appendLocals(req, res) {
    const siteUrl = getCurrentSiteurl(req);
    const pageUrl = req.originalUrl;
    // OK, hack-ish way...
    const pathname = pageUrl.split('?')[0];
    const canonicalUrl = new URL(pathname, app.siteurl);
    const theme = getThemeQuery(req);
    const bodyClass = generateBodyClass(pathname);

    const locals = {
        siteUrl,
        canonicalUrl,
        pageUrl,
        theme,
        bodyClass
    };

    res.locals = Object.assign(res.locals, locals);

    return res;
}

module.exports = {
    appendLocals,
    capitalize,
    generateDataJson,
    theme: {
        get: getTheme,
        selected: selectedTheme
    },
    getCurrentSiteurl,
    getPageTitle,
    generateBodyClass,
    generateSri,
    getSri
};

// vim: ft=javascript sw=4 sts=4 et:
