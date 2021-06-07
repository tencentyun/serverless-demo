'use strict';

module.exports = app => {
  app.view.use('nunjucks', require('./lib/view'));
};
