/*! http://mths.be/windows-1250 v0.1.2 by @mathias | MIT license */
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

	var INDEX_BY_CODE_POINT = {'129':1,'131':3,'136':8,'144':16,'152':24,'160':32,'164':36,'166':38,'167':39,'168':40,'169':41,'171':43,'172':44,'173':45,'174':46,'176':48,'177':49,'180':52,'181':53,'182':54,'183':55,'184':56,'187':59,'193':65,'194':66,'196':68,'199':71,'201':73,'203':75,'205':77,'206':78,'211':83,'212':84,'214':86,'215':87,'218':90,'220':92,'221':93,'223':95,'225':97,'226':98,'228':100,'231':103,'233':105,'235':107,'237':109,'238':110,'243':115,'244':116,'246':118,'247':119,'250':122,'252':124,'253':125,'258':67,'259':99,'260':37,'261':57,'262':70,'263':102,'268':72,'269':104,'270':79,'271':111,'272':80,'273':112,'280':74,'281':106,'282':76,'283':108,'313':69,'314':101,'317':60,'318':62,'321':35,'322':51,'323':81,'324':113,'327':82,'328':114,'336':85,'337':117,'340':64,'341':96,'344':88,'345':120,'346':12,'347':28,'350':42,'351':58,'352':10,'353':26,'354':94,'355':126,'356':13,'357':29,'366':89,'367':121,'368':91,'369':123,'377':15,'378':31,'379':47,'380':63,'381':14,'382':30,'711':33,'728':34,'729':127,'731':50,'733':61,'8211':22,'8212':23,'8216':17,'8217':18,'8218':2,'8220':19,'8221':20,'8222':4,'8224':6,'8225':7,'8226':21,'8230':5,'8240':9,'8249':11,'8250':27,'8364':0,'8482':25};
	var INDEX_BY_POINTER = {'0':'\u20AC','1':'\x81','2':'\u201A','3':'\x83','4':'\u201E','5':'\u2026','6':'\u2020','7':'\u2021','8':'\x88','9':'\u2030','10':'\u0160','11':'\u2039','12':'\u015A','13':'\u0164','14':'\u017D','15':'\u0179','16':'\x90','17':'\u2018','18':'\u2019','19':'\u201C','20':'\u201D','21':'\u2022','22':'\u2013','23':'\u2014','24':'\x98','25':'\u2122','26':'\u0161','27':'\u203A','28':'\u015B','29':'\u0165','30':'\u017E','31':'\u017A','32':'\xA0','33':'\u02C7','34':'\u02D8','35':'\u0141','36':'\xA4','37':'\u0104','38':'\xA6','39':'\xA7','40':'\xA8','41':'\xA9','42':'\u015E','43':'\xAB','44':'\xAC','45':'\xAD','46':'\xAE','47':'\u017B','48':'\xB0','49':'\xB1','50':'\u02DB','51':'\u0142','52':'\xB4','53':'\xB5','54':'\xB6','55':'\xB7','56':'\xB8','57':'\u0105','58':'\u015F','59':'\xBB','60':'\u013D','61':'\u02DD','62':'\u013E','63':'\u017C','64':'\u0154','65':'\xC1','66':'\xC2','67':'\u0102','68':'\xC4','69':'\u0139','70':'\u0106','71':'\xC7','72':'\u010C','73':'\xC9','74':'\u0118','75':'\xCB','76':'\u011A','77':'\xCD','78':'\xCE','79':'\u010E','80':'\u0110','81':'\u0143','82':'\u0147','83':'\xD3','84':'\xD4','85':'\u0150','86':'\xD6','87':'\xD7','88':'\u0158','89':'\u016E','90':'\xDA','91':'\u0170','92':'\xDC','93':'\xDD','94':'\u0162','95':'\xDF','96':'\u0155','97':'\xE1','98':'\xE2','99':'\u0103','100':'\xE4','101':'\u013A','102':'\u0107','103':'\xE7','104':'\u010D','105':'\xE9','106':'\u0119','107':'\xEB','108':'\u011B','109':'\xED','110':'\xEE','111':'\u010F','112':'\u0111','113':'\u0144','114':'\u0148','115':'\xF3','116':'\xF4','117':'\u0151','118':'\xF6','119':'\xF7','120':'\u0159','121':'\u016F','122':'\xFA','123':'\u0171','124':'\xFC','125':'\xFD','126':'\u0163','127':'\u02D9'};

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

	var windows1250 = {
		'encode': encode,
		'decode': decode,
		'labels': [
			'cp1250',
			'windows-1250',
			'x-cp1250'
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
			return windows1250;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = windows1250;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in windows1250) {
				windows1250.hasOwnProperty(key) && (freeExports[key] = windows1250[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.windows1250 = windows1250;
	}

}(this));
