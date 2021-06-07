
// https://github.com/medialize/ally.js/issues/21
export default {
  element: 'div',
  mutate: function mutate(element) {
    element.setAttribute('style', 'width: 100px; height: 50px;');
    element.innerHTML = '<div style="width: 500px; height: 40px;">scrollable content</div>';
  }
};
//# sourceMappingURL=focus-scroll-container-without-overflow.js.map