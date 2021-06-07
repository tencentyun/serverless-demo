'use strict';

const Environment = require('./environment');

module.exports = app => {
  const coreLogger = app.loggers.coreLogger;

  const viewPaths = app.config.view.root;
  coreLogger.info('[egg-view-nunjucks] loading templates from %j', viewPaths);

  const config = app.config.nunjucks;
  config.noCache = !config.cache;
  delete config.cache;

  return new Environment(app);
};
