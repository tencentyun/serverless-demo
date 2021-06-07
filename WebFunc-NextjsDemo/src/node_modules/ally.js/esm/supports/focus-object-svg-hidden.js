
import svg from './media/svg';

// Note: IE10 on BrowserStack does not like this test

export default {
  element: 'object',
  mutate: function mutate(element) {
    element.setAttribute('type', 'image/svg+xml');
    element.setAttribute('data', svg);
    element.setAttribute('width', '200');
    element.setAttribute('height', '50');
    element.style.visibility = 'hidden';
  }
};
//# sourceMappingURL=focus-object-svg-hidden.js.map