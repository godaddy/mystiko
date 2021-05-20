const chalk = require('chalk');

const prefix = 'MYSTIKO:';

module.exports = {
  log: text => {
    console.log(chalk.green(prefix + text));
  },
  warn: text => {
    console.log(chalk.yellow(prefix + text));
  },
  error: text => {
    console.log(chalk.red(prefix + text));
  }
};
