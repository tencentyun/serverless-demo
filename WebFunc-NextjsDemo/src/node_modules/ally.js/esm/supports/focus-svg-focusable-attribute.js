
import { generate, validate } from './helper/svg';

export default {
  element: 'div',
  mutate: function mutate(element) {
    element.innerHTML = generate('<text focusable="true">a</text>');
    return element.querySelector('text');
  },
  validate: validate
};
//# sourceMappingURL=focus-svg-focusable-attribute.js.map