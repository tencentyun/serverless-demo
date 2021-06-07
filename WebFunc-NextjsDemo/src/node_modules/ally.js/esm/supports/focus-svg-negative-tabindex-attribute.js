
import { generate, validate } from './helper/svg';

export default {
  element: 'div',
  mutate: function mutate(element) {
    element.innerHTML = generate('<text tabindex="-1">a</text>');
    return element.querySelector('text');
  },
  validate: validate
};
//# sourceMappingURL=focus-svg-negative-tabindex-attribute.js.map