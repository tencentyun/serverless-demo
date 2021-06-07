
export default {
  element: function element(wrapper, _document) {
    var iframe = _document.createElement('iframe');

    // iframe must be part of the DOM before accessing the contentWindow is possible
    wrapper.appendChild(iframe);

    // create the iframe's default document (<html><head></head><body></body></html>)
    var iframeDocument = iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.close();
    return iframe;
  },
  mutate: function mutate(iframe) {
    iframe.style.visibility = 'hidden';

    var iframeDocument = iframe.contentWindow.document;
    var input = iframeDocument.createElement('input');
    iframeDocument.body.appendChild(input);
    return input;
  },
  validate: function validate(iframe) {
    var iframeDocument = iframe.contentWindow.document;
    var focus = iframeDocument.querySelector('input');
    return iframeDocument.activeElement === focus;
  }
};
//# sourceMappingURL=focus-in-hidden-iframe.js.map