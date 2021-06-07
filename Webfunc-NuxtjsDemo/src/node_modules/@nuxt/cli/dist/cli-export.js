/*!
 * @nuxt/cli v2.14.12 (c) 2016-2020

 * - All the amazing contributors
 * Released under the MIT License.
 * Website: https://nuxtjs.org
*/
'use strict';

require('./cli-index.js');
require('path');
require('@nuxt/config');
require('exit');
require('@nuxt/utils');
require('chalk');
require('std-env');
require('wrap-ansi');
require('boxen');
const consola = require('consola');
require('minimist');
require('hable');
require('fs');
require('execa');
require('upath');
require('fs-extra');
require('buffer');
const generate = require('./cli-generate.js');
require('globby');
require('destr');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

const consola__default = /*#__PURE__*/_interopDefaultLegacy(consola);

const _export = {
  ...generate['default'],
  run (...args) {
    consola__default['default'].warn('`nuxt export` has been deprecated! Please use `nuxt generate`.');
    return generate['default'].run.call(this, ...args)
  }
};

exports.default = _export;
