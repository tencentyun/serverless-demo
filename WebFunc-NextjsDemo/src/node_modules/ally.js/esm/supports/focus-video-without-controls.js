
import mp4 from './media/mp4';

export default {
  element: 'video',
  mutate: function mutate(element) {
    try {
      // invalid media file can trigger warning in console, data-uri to prevent HTTP request
      element.setAttribute('src', mp4);
    } catch (e) {
      // IE9 may throw "Error: Not implemented"
    }
  }
};
//# sourceMappingURL=focus-video-without-controls.js.map