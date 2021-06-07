
import { generate, validate } from './helper/svg';

export default {
  element: 'div',
  mutate: function mutate(element) {
    element.innerHTML = generate('');
    return element.firstChild;
  },
  validate: validate
};
//# sourceMappingURL=focus-svg.js.map