/*! http://mths.be/iso-8859-6 v0.1.2 by @mathias | MIT license */
;(function(root) {

	// Detect free variables `exports`.
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`.
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code, and use
	// it as `root`.
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var object = {};
	var hasOwnProperty = object.hasOwnProperty;
	var stringFromCharCode = String.fromCharCode;

	var INDEX_BY_CODE_POINT = {'128':0,'129':1,'130':2,'131':3,'132':4,'133':5,'134':6,'135':7,'136':8,'137':9,'138':10,'139':11,'140':12,'141':13,'142':14,'143':15,'144':16,'145':17,'146':18,'147':19,'148':20,'149':21,'150':22,'151':23,'152':24,'153':25,'154':26,'155':27,'156':28,'157':29,'158':30,'159':31,'160':32,'164':36,'173':45,'1548':44,'1563':59,'1567':63,'1569':65,'1570':66,'1571':67,'1572':68,'1573':69,'1574':70,'1575':71,'1576':72,'1577':73,'1578':74,'1579':75,'1580':76,'1581':77,'1582':78,'1583':79,'1584':80,'1585':81,'1586':82,'1587':83,'1588':84,'1589':85,'1590':86,'1591':87,'1592':88,'1593':89,'1594':90,'1600':96,'1601':97,'1602':98,'1603':99,'1604':100,'1605':101,'1606':102,'1607':103,'1608':104,'1609':105,'1610':106,'1611':107,'1612':108,'1613':109,'1614':110,'1615':111,'1616':112,'1617':113,'1618':114};
	var INDEX_BY_POINTER = {'0':'\x80','1':'\x81','2':'\x82','3':'\x83','4':'\x84','5':'\x85','6':'\x86','7':'\x87','8':'\x88','9':'\x89','10':'\x8A','11':'\x8B','12':'\x8C','13':'\x8D','14':'\x8E','15':'\x8F','16':'\x90','17':'\x91','18':'\x92','19':'\x93','20':'\x94','21':'\x95','22':'\x96','23':'\x97','24':'\x98','25':'\x99','26':'\x9A','27':'\x9B','28':'\x9C','29':'\x9D','30':'\x9E','31':'\x9F','32':'\xA0','36':'\xA4','44':'\u060C','45':'\xAD','59':'\u061B','63':'\u061F','65':'\u0621','66':'\u0622','67':'\u0623','68':'\u0624','69':'\u0625','70':'\u0626','71':'\u0627','72':'\u0628','73':'\u0629','74':'\u062A','75':'\u062B','76':'\u062C','77':'\u062D','78':'\u062E','79':'\u062F','80':'\u0630','81':'\u0631','82':'\u0632','83':'\u0633','84':'\u0634','85':'\u0635','86':'\u0636','87':'\u0637','88':'\u0638','89':'\u0639','90':'\u063A','96':'\u0640','97':'\u0641','98':'\u0642','99':'\u0643','100':'\u0644','101':'\u0645','102':'\u0646','103':'\u0647','104':'\u0648','105':'\u0649','106':'\u064A','107':'\u064B','108':'\u064C','109':'\u064D','110':'\u064E','111':'\u064F','112':'\u0650','113':'\u0651','114':'\u0652'};

	// http://encoding.spec.whatwg.org/#error-mode
	var error = function(codePoint, mode) {
		if (mode == 'replacement') {
			return '\uFFFD';
		}
		if (codePoint != null && mode == 'html') {
			return '&#' + codePoint + ';';
		}
		// Else, `mode == 'fatal'`.
		throw Error();
	};

	// http://encoding.spec.whatwg.org/#single-byte-decoder
	var decode = function(input, options) {
		var mode;
		if (options && options.mode) {
			mode = options.mode.toLowerCase();
		}
		// “An error mode […] is either `replacement` (default) or `fatal` for a
		// decoder.”
		if (mode != 'replacement' && mode != 'fatal') {
			mode = 'replacement';
		}
		var length = input.length;
		var index = -1;
		var byteValue;
		var pointer;
		var result = '';
		while (++index < length) {
			byteValue = input.charCodeAt(index);
			// “If `byte` is in the range `0x00` to `0x7F`, return a code point whose
			// value is `byte`.”
			if (byteValue >= 0x00 && byteValue <= 0x7F) {
				result += stringFromCharCode(byteValue);
				continue;
			}
			// “Let `code point` be the index code point for `byte − 0x80` in index
			// `single-byte`.”
			pointer = byteValue - 0x80;
			if (hasOwnProperty.call(INDEX_BY_POINTER, pointer)) {
				// “Return a code point whose value is `code point`.”
				result += INDEX_BY_POINTER[pointer];
			} else {
				// “If `code point` is `null`, return `error`.”
				result += error(null, mode);
			}
		}
		return result;
	};

	// http://encoding.spec.whatwg.org/#single-byte-encoder
	var encode = function(input, options) {
		var mode;
		if (options && options.mode) {
			mode = options.mode.toLowerCase();
		}
		// “An error mode […] is either `fatal` (default) or `HTML` for an
		// encoder.”
		if (mode != 'fatal' && mode != 'html') {
			mode = 'fatal';
		}
		var length = input.length;
		var index = -1;
		var codePoint;
		var pointer;
		var result = '';
		while (++index < length) {
			codePoint = input.charCodeAt(index);
			// “If `code point` is in the range U+0000 to U+007F, return a byte whose
			// value is `code point`.”
			if (codePoint >= 0x00 && codePoint <= 0x7F) {
				result += stringFromCharCode(codePoint);
				continue;
			}
			// “Let `pointer` be the index pointer for `code point` in index
			// `single-byte`.”
			if (hasOwnProperty.call(INDEX_BY_CODE_POINT, codePoint)) {
				pointer = INDEX_BY_CODE_POINT[codePoint];
				// “Return a byte whose value is `pointer + 0x80`.”
				result += stringFromCharCode(pointer + 0x80);
			} else {
				// “If `pointer` is `null`, return `error` with `code point`.”
				result += error(codePoint, mode);
			}
		}
		return result;
	};

	var iso88596 = {
		'encode': encode,
		'decode': decode,
		'labels': [
			'arabic',
			'asmo-708',
			'csiso88596e',
			'csiso88596i',
			'csisolatinarabic',
			'ecma-114',
			'iso-8859-6',
			'iso-8859-6-e',
			'iso-8859-6-i',
			'iso-ir-127',
			'iso8859-6',
			'iso88596',
			'iso_8859-6',
			'iso_8859-6:1987'
		],
		'version': '0.1.2'
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return iso88596;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = iso88596;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in iso88596) {
				iso88596.hasOwnProperty(key) && (freeExports[key] = iso88596[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.iso88596 = iso88596;
	}

}(this));
