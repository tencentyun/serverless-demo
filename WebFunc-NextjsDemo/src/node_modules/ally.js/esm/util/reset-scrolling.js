
import getParents from '../get/parents';

export default function collectScrollPositions(element) {
  var parents = getParents({ context: element });
  var list = parents.slice(1).map(function (element) {
    return {
      element: element,
      scrollTop: element.scrollTop,
      scrollLeft: element.scrollLeft
    };
  });

  return function resetScrollPositions() {
    list.forEach(function (entry) {
      entry.element.scrollTop = entry.scrollTop;
      entry.element.scrollLeft = entry.scrollLeft;
    });
  };
}
//# sourceMappingURL=reset-scrolling.js.map