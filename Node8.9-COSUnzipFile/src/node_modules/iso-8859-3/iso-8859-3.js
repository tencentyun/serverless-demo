/*! http://mths.be/iso-8859-3 v0.1.2 by @mathias | MIT license */
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

	var INDEX_BY_CODE_POINT = {'128':0,'129':1,'130':2,'131':3,'132':4,'133':5,'134':6,'135':7,'136':8,'137':9,'138':10,'139':11,'140':12,'141':13,'142':14,'143':15,'144':16,'145':17,'146':18,'147':19,'148':20,'149':21,'150':22,'151':23,'152':24,'153':25,'154':26,'155':27,'156':28,'157':29,'158':30,'159':31,'160':32,'163':35,'164':36,'167':39,'168':40,'173':45,'176':48,'178':50,'179':51,'180':52,'181':53,'183':55,'184':56,'189':61,'192':64,'193':65,'194':66,'196':68,'199':71,'200':72,'201':73,'202':74,'203':75,'204':76,'205':77,'206':78,'207':79,'209':81,'210':82,'211':83,'212':84,'214':86,'215':87,'217':89,'218':90,'219':91,'220':92,'223':95,'224':96,'225':97,'226':98,'228':100,'231':103,'232':104,'233':105,'234':106,'235':107,'236':108,'237':109,'238':110,'239':111,'241':113,'242':114,'243':115,'244':116,'246':118,'247':119,'249':121,'250':122,'251':123,'252':124,'264':70,'265':102,'266':69,'267':101,'284':88,'285':120,'286':43,'287':59,'288':85,'289':117,'292':38,'293':54,'294':33,'295':49,'304':41,'305':57,'308':44,'309':60,'348':94,'349':126,'350':42,'351':58,'364':93,'365':125,'379':47,'380':63,'728':34,'729':127};
	var INDEX_BY_POINTER = {'0':'\x80','1':'\x81','2':'\x82','3':'\x83','4':'\x84','5':'\x85','6':'\x86','7':'\x87','8':'\x88','9':'\x89','10':'\x8A','11':'\x8B','12':'\x8C','13':'\x8D','14':'\x8E','15':'\x8F','16':'\x90','17':'\x91','18':'\x92','19':'\x93','20':'\x94','21':'\x95','22':'\x96','23':'\x97','24':'\x98','25':'\x99','26':'\x9A','27':'\x9B','28':'\x9C','29':'\x9D','30':'\x9E','31':'\x9F','32':'\xA0','33':'\u0126','34':'\u02D8','35':'\xA3','36':'\xA4','38':'\u0124','39':'\xA7','40':'\xA8','41':'\u0130','42':'\u015E','43':'\u011E','44':'\u0134','45':'\xAD','47':'\u017B','48':'\xB0','49':'\u0127','50':'\xB2','51':'\xB3','52':'\xB4','53':'\xB5','54':'\u0125','55':'\xB7','56':'\xB8','57':'\u0131','58':'\u015F','59':'\u011F','60':'\u0135','61':'\xBD','63':'\u017C','64':'\xC0','65':'\xC1','66':'\xC2','68':'\xC4','69':'\u010A','70':'\u0108','71':'\xC7','72':'\xC8','73':'\xC9','74':'\xCA','75':'\xCB','76':'\xCC','77':'\xCD','78':'\xCE','79':'\xCF','81':'\xD1','82':'\xD2','83':'\xD3','84':'\xD4','85':'\u0120','86':'\xD6','87':'\xD7','88':'\u011C','89':'\xD9','90':'\xDA','91':'\xDB','92':'\xDC','93':'\u016C','94':'\u015C','95':'\xDF','96':'\xE0','97':'\xE1','98':'\xE2','100':'\xE4','101':'\u010B','102':'\u0109','103':'\xE7','104':'\xE8','105':'\xE9','106':'\xEA','107':'\xEB','108':'\xEC','109':'\xED','110':'\xEE','111':'\xEF','113':'\xF1','114':'\xF2','115':'\xF3','116':'\xF4','117':'\u0121','118':'\xF6','119':'\xF7','120':'\u011D','121':'\xF9','122':'\xFA','123':'\xFB','124':'\xFC','125':'\u016D','126':'\u015D','127':'\u02D9'};

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

	var iso88593 = {
		'encode': encode,
		'decode': decode,
		'labels': [
			'csisolatin3',
			'iso-8859-3',
			'iso-ir-109',
			'iso8859-3',
			'iso88593',
			'iso_8859-3',
			'iso_8859-3:1988',
			'l3',
			'latin3'
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
			return iso88593;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = iso88593;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in iso88593) {
				iso88593.hasOwnProperty(key) && (freeExports[key] = iso88593[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.iso88593 = iso88593;
	}

}(this));
