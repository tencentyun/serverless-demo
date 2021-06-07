
export default {
  element: 'label',
  mutate: function mutate(element) {
    element.setAttribute('tabindex', '-1');
  },
  validate: function validate(element, focusTarget, _document) {
    // force layout in Chrome 49, otherwise the element won't be focusable
    /* eslint-disable no-unused-vars */
    var variableToPreventDeadCodeElimination = element.offsetHeight;
    /* eslint-enable no-unused-vars */
    element.focus();
    return _document.activeElement === element;
  }
};
//# sourceMappingURL=focus-label-tabindex.js.map