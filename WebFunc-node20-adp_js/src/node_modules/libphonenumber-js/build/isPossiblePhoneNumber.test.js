"use strict";

var _isPossiblePhoneNumber2 = _interopRequireDefault(require("./isPossiblePhoneNumber.js"));
var _metadataMin = _interopRequireDefault(require("../metadata.min.json"));
var _metadataMin2 = _interopRequireDefault(require("../test/metadata/1.0.0/metadata.min.json"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function isPossiblePhoneNumber() {
  for (var _len = arguments.length, parameters = new Array(_len), _key = 0; _key < _len; _key++) {
    parameters[_key] = arguments[_key];
  }
  parameters.push(_metadataMin["default"]);
  return _isPossiblePhoneNumber2["default"].apply(this, parameters);
}
describe('isPossiblePhoneNumber', function () {
  it('should detect whether a phone number is possible', function () {
    expect(isPossiblePhoneNumber('8 (800) 555 35 35', 'RU')).to.equal(true);
    expect(isPossiblePhoneNumber('8 (800) 555 35 35 0', 'RU')).to.equal(false);
    expect(isPossiblePhoneNumber('Call: 8 (800) 555 35 35', 'RU')).to.equal(false);
    expect(isPossiblePhoneNumber('8 (800) 555 35 35', {
      defaultCountry: 'RU'
    })).to.equal(true);
    expect(isPossiblePhoneNumber('+7 (800) 555 35 35')).to.equal(true);
    expect(isPossiblePhoneNumber('+7 1 (800) 555 35 35')).to.equal(false);
    expect(isPossiblePhoneNumber(' +7 (800) 555 35 35')).to.equal(false);
    expect(isPossiblePhoneNumber(' ')).to.equal(false);
  });
  it('should detect whether a phone number is possible when using old metadata', function () {
    expect(function () {
      return (0, _isPossiblePhoneNumber2["default"])('8 (800) 555 35 35', 'RU', _metadataMin2["default"]);
    }).to["throw"]('Missing "possibleLengths" in metadata.');
    expect((0, _isPossiblePhoneNumber2["default"])('+888 123 456 78901', _metadataMin2["default"])).to.equal(true);
  });
  it('should handle the cases when multiple countries share the same country calling code and a phone number is possible in non-"main" country and is not possible in the "main" country', function () {
    // Tests that Californian numbers `+1310xxxx` are considered possible.
    // https://gitlab.com/catamphetamine/react-phone-number-input/-/issues/228#note_1872536721
    expect(isPossiblePhoneNumber('+13100000', 'CA')).to.equal(true);
    expect(isPossiblePhoneNumber('3100000', 'CA')).to.equal(true);
  });
});
//# sourceMappingURL=isPossiblePhoneNumber.test.js.map