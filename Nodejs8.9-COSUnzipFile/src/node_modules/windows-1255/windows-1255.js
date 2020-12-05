/*! http://mths.be/windows-1255 v0.1.2 by @mathias | MIT license */
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

	var INDEX_BY_CODE_POINT = {'129':1,'138':10,'140':12,'141':13,'142':14,'143':15,'144':16,'154':26,'156':28,'157':29,'158':30,'159':31,'160':32,'161':33,'162':34,'163':35,'165':37,'166':38,'167':39,'168':40,'169':41,'171':43,'172':44,'173':45,'174':46,'175':47,'176':48,'177':49,'178':50,'179':51,'180':52,'181':53,'182':54,'183':55,'184':56,'185':57,'187':59,'188':60,'189':61,'190':62,'191':63,'215':42,'247':58,'402':3,'710':8,'732':24,'1456':64,'1457':65,'1458':66,'1459':67,'1460':68,'1461':69,'1462':70,'1463':71,'1464':72,'1465':73,'1467':75,'1468':76,'1469':77,'1470':78,'1471':79,'1472':80,'1473':81,'1474':82,'1475':83,'1488':96,'1489':97,'1490':98,'1491':99,'1492':100,'1493':101,'1494':102,'1495':103,'1496':104,'1497':105,'1498':106,'1499':107,'1500':108,'1501':109,'1502':110,'1503':111,'1504':112,'1505':113,'1506':114,'1507':115,'1508':116,'1509':117,'1510':118,'1511':119,'1512':120,'1513':121,'1514':122,'1520':84,'1521':85,'1522':86,'1523':87,'1524':88,'8206':125,'8207':126,'8211':22,'8212':23,'8216':17,'8217':18,'8218':2,'8220':19,'8221':20,'8222':4,'8224':6,'8225':7,'8226':21,'8230':5,'8240':9,'8249':11,'8250':27,'8362':36,'8364':0,'8482':25};
	var INDEX_BY_POINTER = {'0':'\u20AC','1':'\x81','2':'\u201A','3':'\u0192','4':'\u201E','5':'\u2026','6':'\u2020','7':'\u2021','8':'\u02C6','9':'\u2030','10':'\x8A','11':'\u2039','12':'\x8C','13':'\x8D','14':'\x8E','15':'\x8F','16':'\x90','17':'\u2018','18':'\u2019','19':'\u201C','20':'\u201D','21':'\u2022','22':'\u2013','23':'\u2014','24':'\u02DC','25':'\u2122','26':'\x9A','27':'\u203A','28':'\x9C','29':'\x9D','30':'\x9E','31':'\x9F','32':'\xA0','33':'\xA1','34':'\xA2','35':'\xA3','36':'\u20AA','37':'\xA5','38':'\xA6','39':'\xA7','40':'\xA8','41':'\xA9','42':'\xD7','43':'\xAB','44':'\xAC','45':'\xAD','46':'\xAE','47':'\xAF','48':'\xB0','49':'\xB1','50':'\xB2','51':'\xB3','52':'\xB4','53':'\xB5','54':'\xB6','55':'\xB7','56':'\xB8','57':'\xB9','58':'\xF7','59':'\xBB','60':'\xBC','61':'\xBD','62':'\xBE','63':'\xBF','64':'\u05B0','65':'\u05B1','66':'\u05B2','67':'\u05B3','68':'\u05B4','69':'\u05B5','70':'\u05B6','71':'\u05B7','72':'\u05B8','73':'\u05B9','75':'\u05BB','76':'\u05BC','77':'\u05BD','78':'\u05BE','79':'\u05BF','80':'\u05C0','81':'\u05C1','82':'\u05C2','83':'\u05C3','84':'\u05F0','85':'\u05F1','86':'\u05F2','87':'\u05F3','88':'\u05F4','96':'\u05D0','97':'\u05D1','98':'\u05D2','99':'\u05D3','100':'\u05D4','101':'\u05D5','102':'\u05D6','103':'\u05D7','104':'\u05D8','105':'\u05D9','106':'\u05DA','107':'\u05DB','108':'\u05DC','109':'\u05DD','110':'\u05DE','111':'\u05DF','112':'\u05E0','113':'\u05E1','114':'\u05E2','115':'\u05E3','116':'\u05E4','117':'\u05E5','118':'\u05E6','119':'\u05E7','120':'\u05E8','121':'\u05E9','122':'\u05EA','125':'\u200E','126':'\u200F'};

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

	var windows1255 = {
		'encode': encode,
		'decode': decode,
		'labels': [
			'cp1255',
			'windows-1255',
			'x-cp1255'
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
			return windows1255;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = windows1255;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in windows1255) {
				windows1255.hasOwnProperty(key) && (freeExports[key] = windows1255[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.windows1255 = windows1255;
	}

}(this));
