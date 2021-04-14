/*! http://mths.be/macintosh v0.1.2 by @mathias | MIT license */
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

	var INDEX_BY_CODE_POINT = {'160':74,'161':65,'162':34,'163':35,'165':52,'167':36,'168':44,'169':41,'170':59,'171':71,'172':66,'174':40,'175':120,'176':33,'177':49,'180':43,'181':53,'182':38,'183':97,'184':124,'186':60,'187':72,'191':64,'192':75,'193':103,'194':101,'195':76,'196':0,'197':1,'198':46,'199':2,'200':105,'201':3,'202':102,'203':104,'204':109,'205':106,'206':107,'207':108,'209':4,'210':113,'211':110,'212':111,'213':77,'214':5,'216':47,'217':116,'218':114,'219':115,'220':6,'223':39,'224':8,'225':7,'226':9,'227':11,'228':10,'229':12,'230':62,'231':13,'232':15,'233':14,'234':16,'235':17,'236':19,'237':18,'238':20,'239':21,'241':22,'242':24,'243':23,'244':25,'245':27,'246':26,'247':86,'248':63,'249':29,'250':28,'251':30,'252':31,'255':88,'305':117,'338':78,'339':79,'376':89,'402':68,'710':118,'711':127,'728':121,'729':122,'730':123,'731':126,'732':119,'733':125,'937':61,'960':57,'8211':80,'8212':81,'8216':84,'8217':85,'8218':98,'8220':82,'8221':83,'8222':99,'8224':32,'8225':96,'8226':37,'8230':73,'8240':100,'8249':92,'8250':93,'8260':90,'8364':91,'8482':42,'8706':54,'8710':70,'8719':56,'8721':55,'8730':67,'8734':48,'8747':58,'8776':69,'8800':45,'8804':50,'8805':51,'9674':87,'63743':112,'64257':94,'64258':95};
	var INDEX_BY_POINTER = {'0':'\xC4','1':'\xC5','2':'\xC7','3':'\xC9','4':'\xD1','5':'\xD6','6':'\xDC','7':'\xE1','8':'\xE0','9':'\xE2','10':'\xE4','11':'\xE3','12':'\xE5','13':'\xE7','14':'\xE9','15':'\xE8','16':'\xEA','17':'\xEB','18':'\xED','19':'\xEC','20':'\xEE','21':'\xEF','22':'\xF1','23':'\xF3','24':'\xF2','25':'\xF4','26':'\xF6','27':'\xF5','28':'\xFA','29':'\xF9','30':'\xFB','31':'\xFC','32':'\u2020','33':'\xB0','34':'\xA2','35':'\xA3','36':'\xA7','37':'\u2022','38':'\xB6','39':'\xDF','40':'\xAE','41':'\xA9','42':'\u2122','43':'\xB4','44':'\xA8','45':'\u2260','46':'\xC6','47':'\xD8','48':'\u221E','49':'\xB1','50':'\u2264','51':'\u2265','52':'\xA5','53':'\xB5','54':'\u2202','55':'\u2211','56':'\u220F','57':'\u03C0','58':'\u222B','59':'\xAA','60':'\xBA','61':'\u03A9','62':'\xE6','63':'\xF8','64':'\xBF','65':'\xA1','66':'\xAC','67':'\u221A','68':'\u0192','69':'\u2248','70':'\u2206','71':'\xAB','72':'\xBB','73':'\u2026','74':'\xA0','75':'\xC0','76':'\xC3','77':'\xD5','78':'\u0152','79':'\u0153','80':'\u2013','81':'\u2014','82':'\u201C','83':'\u201D','84':'\u2018','85':'\u2019','86':'\xF7','87':'\u25CA','88':'\xFF','89':'\u0178','90':'\u2044','91':'\u20AC','92':'\u2039','93':'\u203A','94':'\uFB01','95':'\uFB02','96':'\u2021','97':'\xB7','98':'\u201A','99':'\u201E','100':'\u2030','101':'\xC2','102':'\xCA','103':'\xC1','104':'\xCB','105':'\xC8','106':'\xCD','107':'\xCE','108':'\xCF','109':'\xCC','110':'\xD3','111':'\xD4','112':'\uF8FF','113':'\xD2','114':'\xDA','115':'\xDB','116':'\xD9','117':'\u0131','118':'\u02C6','119':'\u02DC','120':'\xAF','121':'\u02D8','122':'\u02D9','123':'\u02DA','124':'\xB8','125':'\u02DD','126':'\u02DB','127':'\u02C7'};

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

	var macintosh = {
		'encode': encode,
		'decode': decode,
		'labels': [
			'csmacintosh',
			'mac',
			'macintosh',
			'x-mac-roman'
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
			return macintosh;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = macintosh;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in macintosh) {
				macintosh.hasOwnProperty(key) && (freeExports[key] = macintosh[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.macintosh = macintosh;
	}

}(this));
