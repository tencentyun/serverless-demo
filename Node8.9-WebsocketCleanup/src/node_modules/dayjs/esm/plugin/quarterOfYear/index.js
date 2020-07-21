export default (function (o, c) {
  var proto = c.prototype;

  proto.quarter = function () {
    return Math.ceil((this.month() + 1) / 3);
  };
});