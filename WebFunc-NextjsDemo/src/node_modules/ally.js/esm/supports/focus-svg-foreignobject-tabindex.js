
import { generate, validate } from './helper/svg';

export default {
  element: 'div',
  mutate: function mutate(element) {
    element.innerHTML = generate('<foreignObject tabindex="-1"><input type="text" /></foreignObject>');
    // Safari 8's quersSelector() can't identify foreignObject, but getElementyByTagName() can
    return element.querySelector('foreignObject') || element.getElementsByTagName('foreignObject')[0];
  },
  validate: validate

};
//# sourceMappingURL=focus-svg-foreignobject-tabindex.js.map