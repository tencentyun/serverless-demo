/*!
 * @nuxt/cli v2.14.12 (c) 2016-2020

 * - All the amazing contributors
 * Released under the MIT License.
 * Website: https://nuxtjs.org
*/
'use strict';

const index = require('./cli-index.js');
require('path');
require('@nuxt/config');
require('exit');
require('@nuxt/utils');
const chalk = require('chalk');
require('std-env');
require('wrap-ansi');
require('boxen');
const consola = require('consola');
require('minimist');
require('hable');
require('fs');
require('execa');
require('pretty-bytes');
const banner = require('./cli-banner.js');
const opener = require('opener');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

const chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
const consola__default = /*#__PURE__*/_interopDefaultLegacy(consola);
const opener__default = /*#__PURE__*/_interopDefaultLegacy(opener);

const dev = {
  name: 'dev',
  description: 'Start the application in development mode (e.g. hot-code reloading, error reporting)',
  usage: 'dev <dir>',
  options: {
    ...index.common,
    ...index.server$1,
    open: {
      alias: 'o',
      type: 'boolean',
      description: 'Opens the server listeners url in the default browser'
    }
  },

  async run (cmd) {
    const { argv } = cmd;

    await this.startDev(cmd, argv, argv.open);
  },

  async startDev (cmd, argv) {
    let nuxt;
    try {
      nuxt = await this._listenDev(cmd, argv);
    } catch (error) {
      consola__default['default'].fatal(error);
      return
    }

    try {
      await this._buildDev(cmd, argv, nuxt);
    } catch (error) {
      await nuxt.callHook('cli:buildError', error);
      consola__default['default'].error(error);
    }

    return nuxt
  },

  async _listenDev (cmd, argv) {
    const config = await cmd.getNuxtConfig({ dev: true, _build: true });
    const nuxt = await cmd.getNuxt(config);

    // Setup hooks
    nuxt.hook('watch:restart', payload => this.onWatchRestart(payload, { nuxt, cmd, argv }));
    nuxt.hook('bundler:change', changedFileName => this.onBundlerChange(changedFileName));

    // Wait for nuxt to be ready
    await nuxt.ready();

    // Start listening
    await nuxt.server.listen();

    // Show banner when listening
    banner.showBanner(nuxt, false);

    // Opens the server listeners url in the default browser (only once)
    if (argv.open) {
      argv.open = false;
      const openerPromises = nuxt.server.listeners.map(listener => opener__default['default'](listener.url));
      await Promise.all(openerPromises);
    }

    // Return instance
    return nuxt
  },

  async _buildDev (cmd, argv, nuxt) {
    // Create builder instance
    const builder = await cmd.getBuilder(nuxt);

    // Start Build
    await builder.build();

    // Print memory usage
    banner.showMemoryUsage();

    // Display server urls after the build
    for (const listener of nuxt.server.listeners) {
      consola__default['default'].info(chalk__default['default'].bold('Listening on: ') + listener.url);
    }

    // Return instance
    return nuxt
  },

  logChanged ({ event, path }) {
    const { icon, color, action } = index.eventsMapping[event] || index.eventsMapping.change;

    consola__default['default'].log({
      type: event,
      icon: chalk__default['default'][color].bold(icon),
      message: `${action} ${chalk__default['default'].cyan(index.formatPath(path))}`
    });
  },

  async onWatchRestart ({ event, path }, { nuxt, cmd, argv }) {
    this.logChanged({ event, path });

    await nuxt.close();

    await this.startDev(cmd, argv);
  },

  onBundlerChange (path) {
    this.logChanged({ event: 'change', path });
  }
};

exports.default = dev;
