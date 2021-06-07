'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (element) {
  // Edge13, Edge14: foreignObject focus hack
  // https://jsbin.com/kunehinugi/edit?html,js,output
  // https://jsbin.com/fajagi/3/edit?html,js,output
  var isSvgElement = element.ownerSVGElement || element.nodeName.toLowerCase() === 'svg';
  if (!isSvgElement) {
    return false;
  }

  // inject and focus an <input> element into the SVG element to receive focus
  var foreignObject = makeFocusableForeignObject();
  element.appendChild(foreignObject);
  var input = foreignObject.querySelector('input');
  input.focus();

  // upon disabling the activeElement, IE and Edge
  // will not shift focus to <body> like all the other
  // browsers, but instead find the first focusable
  // ancestor and shift focus to that
  input.disabled = true;

  // clean up
  element.removeChild(foreignObject);
  return true;
};

function makeFocusableForeignObject() {
  var fragment = document.createElement('div');
  fragment.innerHTML = '<svg><foreignObject width="30" height="30">\n      <input type="text"/>\n  </foreignObject></svg>';

  return fragment.firstChild.firstChild;
}

module.exports = exports['default'];
//# sourceMappingURL=focus.svg-foreign-object-hack.js.map