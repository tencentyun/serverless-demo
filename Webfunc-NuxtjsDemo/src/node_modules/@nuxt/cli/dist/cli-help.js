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

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

const chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
const consola__default = /*#__PURE__*/_interopDefaultLegacy(consola);

async function listCommands () {
  const commandsOrder = ['dev', 'build', 'generate', 'start', 'help'];

  // Load all commands
  const _commands = await Promise.all(
    commandsOrder.map(cmd => index.getCommand(cmd))
  );

  let maxLength = 0;
  const commandsHelp = [];

  for (const command of _commands) {
    commandsHelp.push([command.usage, command.description]);
    maxLength = Math.max(maxLength, command.usage.length);
  }

  const _cmds = commandsHelp.map(([cmd, description]) => {
    const i = index.indent(maxLength + index.optionSpaces - cmd.length);
    return index.foldLines(
      chalk__default['default'].green(cmd) + i + description,
      index.startSpaces + maxLength + index.optionSpaces * 2,
      index.startSpaces + index.optionSpaces
    )
  }).join('\n');

  const usage = index.foldLines('Usage: nuxt <command> [--help|-h]', index.startSpaces);
  const cmds = index.foldLines('Commands:', index.startSpaces) + '\n\n' + _cmds;

  process.stderr.write(index.colorize(`${usage}\n\n${cmds}\n\n`));
}

const help = {
  name: 'help',
  description: 'Shows help for <command>',
  usage: 'help <command>',
  options: {
    help: index.common.help,
    version: index.common.version
  },
  async run (cmd) {
    const [name] = cmd._argv;
    if (!name) {
      return listCommands()
    }
    const command = await index.getCommand(name);

    if (!command) {
      consola__default['default'].info(`Unknown command: ${name}`);
      return
    }

    index.NuxtCommand.from(command).showHelp();
  }
};

exports.default = help;
