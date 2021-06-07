
// helper to turn
//  <div some-attribute="original">
// into
//  <div some-attribute="new" data-cached-some-attribute="original">
// and back

export default function (_ref) {
  var element = _ref.element,
      attribute = _ref.attribute,
      temporaryValue = _ref.temporaryValue,
      saveValue = _ref.saveValue;

  var temporaryAttribute = 'data-cached-' + attribute;

  if (temporaryValue !== undefined) {
    var _value = saveValue || element.getAttribute(attribute);
    element.setAttribute(temporaryAttribute, _value || '');
    element.setAttribute(attribute, temporaryValue);
  } else {
    var _value2 = element.getAttribute(temporaryAttribute);
    element.removeAttribute(temporaryAttribute);
    if (_value2 === '') {
      element.removeAttribute(attribute);
    } else {
      element.setAttribute(attribute, _value2);
    }
  }
}
//# sourceMappingURL=toggle-attribute-value.js.map