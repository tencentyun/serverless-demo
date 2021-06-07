'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  if (supportsCache) {
    return supportsCache;
  }

  supportsCache = _supportsCache2.default.get();
  if (!supportsCache.time) {
    _supportsCache2.default.set(executeTests());
    supportsCache = _supportsCache2.default.get();
  }

  return supportsCache;
};

var _detectFocus = require('./detect-focus');

var _detectFocus2 = _interopRequireDefault(_detectFocus);

var _supportsCache = require('./supports-cache');

var _supportsCache2 = _interopRequireDefault(_supportsCache);

var _cssShadowPiercingDeepCombinator = require('./css-shadow-piercing-deep-combinator');

var _cssShadowPiercingDeepCombinator2 = _interopRequireDefault(_cssShadowPiercingDeepCombinator);

var _focusAreaImgTabindex = require('./focus-area-img-tabindex');

var _focusAreaImgTabindex2 = _interopRequireDefault(_focusAreaImgTabindex);

var _focusAreaTabindex = require('./focus-area-tabindex');

var _focusAreaTabindex2 = _interopRequireDefault(_focusAreaTabindex);

var _focusAreaWithoutHref = require('./focus-area-without-href');

var _focusAreaWithoutHref2 = _interopRequireDefault(_focusAreaWithoutHref);

var _focusAudioWithoutControls = require('./focus-audio-without-controls');

var _focusAudioWithoutControls2 = _interopRequireDefault(_focusAudioWithoutControls);

var _focusBrokenImageMap = require('./focus-broken-image-map');

var _focusBrokenImageMap2 = _interopRequireDefault(_focusBrokenImageMap);

var _focusChildrenOfFocusableFlexbox = require('./focus-children-of-focusable-flexbox');

var _focusChildrenOfFocusableFlexbox2 = _interopRequireDefault(_focusChildrenOfFocusableFlexbox);

var _focusFieldsetDisabled = require('./focus-fieldset-disabled');

var _focusFieldsetDisabled2 = _interopRequireDefault(_focusFieldsetDisabled);

var _focusFieldset = require('./focus-fieldset');

var _focusFieldset2 = _interopRequireDefault(_focusFieldset);

var _focusFlexboxContainer = require('./focus-flexbox-container');

var _focusFlexboxContainer2 = _interopRequireDefault(_focusFlexboxContainer);

var _focusFormDisabled = require('./focus-form-disabled');

var _focusFormDisabled2 = _interopRequireDefault(_focusFormDisabled);

var _focusImgIsmap = require('./focus-img-ismap');

var _focusImgIsmap2 = _interopRequireDefault(_focusImgIsmap);

var _focusImgUsemapTabindex = require('./focus-img-usemap-tabindex');

var _focusImgUsemapTabindex2 = _interopRequireDefault(_focusImgUsemapTabindex);

var _focusInHiddenIframe = require('./focus-in-hidden-iframe');

var _focusInHiddenIframe2 = _interopRequireDefault(_focusInHiddenIframe);

var _focusInZeroDimensionObject = require('./focus-in-zero-dimension-object');

var _focusInZeroDimensionObject2 = _interopRequireDefault(_focusInZeroDimensionObject);

var _focusInvalidTabindex = require('./focus-invalid-tabindex');

var _focusInvalidTabindex2 = _interopRequireDefault(_focusInvalidTabindex);

var _focusLabelTabindex = require('./focus-label-tabindex');

var _focusLabelTabindex2 = _interopRequireDefault(_focusLabelTabindex);

var _focusObjectSvgHidden = require('./focus-object-svg-hidden');

var _focusObjectSvgHidden2 = _interopRequireDefault(_focusObjectSvgHidden);

var _focusObjectSvg = require('./focus-object-svg');

var _focusObjectSvg2 = _interopRequireDefault(_focusObjectSvg);

var _focusObjectSwf = require('./focus-object-swf');

var _focusObjectSwf2 = _interopRequireDefault(_focusObjectSwf);

var _focusRedirectImgUsemap = require('./focus-redirect-img-usemap');

var _focusRedirectImgUsemap2 = _interopRequireDefault(_focusRedirectImgUsemap);

var _focusRedirectLegend = require('./focus-redirect-legend');

var _focusRedirectLegend2 = _interopRequireDefault(_focusRedirectLegend);

var _focusScrollBody = require('./focus-scroll-body');

var _focusScrollBody2 = _interopRequireDefault(_focusScrollBody);

var _focusScrollContainerWithoutOverflow = require('./focus-scroll-container-without-overflow');

var _focusScrollContainerWithoutOverflow2 = _interopRequireDefault(_focusScrollContainerWithoutOverflow);

var _focusScrollContainer = require('./focus-scroll-container');

var _focusScrollContainer2 = _interopRequireDefault(_focusScrollContainer);

var _focusSummary = require('./focus-summary');

var _focusSummary2 = _interopRequireDefault(_focusSummary);

var _focusSvgFocusableAttribute = require('./focus-svg-focusable-attribute');

var _focusSvgFocusableAttribute2 = _interopRequireDefault(_focusSvgFocusableAttribute);

var _focusSvgTabindexAttribute = require('./focus-svg-tabindex-attribute');

var _focusSvgTabindexAttribute2 = _interopRequireDefault(_focusSvgTabindexAttribute);

var _focusSvgNegativeTabindexAttribute = require('./focus-svg-negative-tabindex-attribute');

var _focusSvgNegativeTabindexAttribute2 = _interopRequireDefault(_focusSvgNegativeTabindexAttribute);

var _focusSvgUseTabindex = require('./focus-svg-use-tabindex');

var _focusSvgUseTabindex2 = _interopRequireDefault(_focusSvgUseTabindex);

var _focusSvgForeignobjectTabindex = require('./focus-svg-foreignobject-tabindex');

var _focusSvgForeignobjectTabindex2 = _interopRequireDefault(_focusSvgForeignobjectTabindex);

var _focusSvgInIframe = require('./focus-svg-in-iframe');

var _focusSvgInIframe2 = _interopRequireDefault(_focusSvgInIframe);

var _focusSvg = require('./focus-svg');

var _focusSvg2 = _interopRequireDefault(_focusSvg);

var _focusTabindexTrailingCharacters = require('./focus-tabindex-trailing-characters');

var _focusTabindexTrailingCharacters2 = _interopRequireDefault(_focusTabindexTrailingCharacters);

var _focusTable = require('./focus-table');

var _focusTable2 = _interopRequireDefault(_focusTable);

var _focusVideoWithoutControls = require('./focus-video-without-controls');

var _focusVideoWithoutControls2 = _interopRequireDefault(_focusVideoWithoutControls);

var _tabsequenceAreaAtImgPosition = require('./tabsequence-area-at-img-position');

var _tabsequenceAreaAtImgPosition2 = _interopRequireDefault(_tabsequenceAreaAtImgPosition);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var testCallbacks = {
  cssShadowPiercingDeepCombinator: _cssShadowPiercingDeepCombinator2.default,
  focusInZeroDimensionObject: _focusInZeroDimensionObject2.default,
  focusObjectSwf: _focusObjectSwf2.default,
  focusSvgInIframe: _focusSvgInIframe2.default,
  tabsequenceAreaAtImgPosition: _tabsequenceAreaAtImgPosition2.default
};

var testDescriptions = {
  focusAreaImgTabindex: _focusAreaImgTabindex2.default,
  focusAreaTabindex: _focusAreaTabindex2.default,
  focusAreaWithoutHref: _focusAreaWithoutHref2.default,
  focusAudioWithoutControls: _focusAudioWithoutControls2.default,
  focusBrokenImageMap: _focusBrokenImageMap2.default,
  focusChildrenOfFocusableFlexbox: _focusChildrenOfFocusableFlexbox2.default,
  focusFieldsetDisabled: _focusFieldsetDisabled2.default,
  focusFieldset: _focusFieldset2.default,
  focusFlexboxContainer: _focusFlexboxContainer2.default,
  focusFormDisabled: _focusFormDisabled2.default,
  focusImgIsmap: _focusImgIsmap2.default,
  focusImgUsemapTabindex: _focusImgUsemapTabindex2.default,
  focusInHiddenIframe: _focusInHiddenIframe2.default,
  focusInvalidTabindex: _focusInvalidTabindex2.default,
  focusLabelTabindex: _focusLabelTabindex2.default,
  focusObjectSvg: _focusObjectSvg2.default,
  focusObjectSvgHidden: _focusObjectSvgHidden2.default,
  focusRedirectImgUsemap: _focusRedirectImgUsemap2.default,
  focusRedirectLegend: _focusRedirectLegend2.default,
  focusScrollBody: _focusScrollBody2.default,
  focusScrollContainerWithoutOverflow: _focusScrollContainerWithoutOverflow2.default,
  focusScrollContainer: _focusScrollContainer2.default,
  focusSummary: _focusSummary2.default,
  focusSvgFocusableAttribute: _focusSvgFocusableAttribute2.default,
  focusSvgTabindexAttribute: _focusSvgTabindexAttribute2.default,
  focusSvgNegativeTabindexAttribute: _focusSvgNegativeTabindexAttribute2.default,
  focusSvgUseTabindex: _focusSvgUseTabindex2.default,
  focusSvgForeignobjectTabindex: _focusSvgForeignobjectTabindex2.default,
  focusSvg: _focusSvg2.default,
  focusTabindexTrailingCharacters: _focusTabindexTrailingCharacters2.default,
  focusTable: _focusTable2.default,
  focusVideoWithoutControls: _focusVideoWithoutControls2.default
};

function executeTests() {
  var results = (0, _detectFocus2.default)(testDescriptions);
  Object.keys(testCallbacks).forEach(function (key) {
    results[key] = testCallbacks[key]();
  });

  return results;
}

var supportsCache = null;

module.exports = exports['default'];
//# sourceMappingURL=supports.js.map