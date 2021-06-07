'use strict';

module.exports = (app, buildInFilters) => {

  /**
   * NunjucksViewHelper extends {@link Helper} for nunjucks templates.
   * Wrap some helpers for safe string, and transform build-in filters to helpers
   */
  class NunjucksViewHelper extends app.Helper {
    /**
     * See {@link Helper#shtml}
     * @param {String} str - the string that will be transformed to safe html
     * @return {String} str - the result
     */
    shtml(str) {
      return this.safe(super.shtml(str));
    }

    /**
     * See {@link Helper#surl}
     * @param {String} str - the string that will be transformed to safe url
     * @return {String} str - the result
     */
    surl(str) {
      return this.safe(super.surl(str));
    }


    /**
     * See {@link Helper#sjs}
     * @param {String} str - the string that will be transformed to safe js
     * @return {String} str - the result
     */
    sjs(str) {
      return this.safe(super.sjs(str));
    }

    /**
     * don't use `super.helper.escape` directly due to `SafeString` checking
     * see https://github.com/mozilla/nunjucks/blob/master/src/filters.js#L119
     * buildInFilters.escape is `nunjucks.filters.escape` which will call `nunjucks.lib.escape`
     * and `nunjucks.lib.escape` is overrided by `app.Helper.escape` for better performance
     * @param {String} str - the string that will be escaped
     * @return {String} str - the result
     */
    escape(str) {
      return buildInFilters.escape(str);
    }

    /**
     * get hidden filed for `csrf`
     * @return {String} html string
     */
    csrfTag() {
      return this.safe(`<input type="hidden" name="_csrf" value="${this.ctx.csrf}" />`);
    }
  }

  // fill view helper with nunjucks build-in filters
  for (const key in buildInFilters) {
    if (NunjucksViewHelper.prototype[key] == null) {
      NunjucksViewHelper.prototype[key] = buildInFilters[key];
    }
  }

  return NunjucksViewHelper;
};
