/*! http://mths.be/windows-1257 v0.1.2 by @mathias | MIT license */
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

	var INDEX_BY_CODE_POINT = {'129':1,'131':3,'136':8,'138':10,'140':12,'144':16,'152':24,'154':26,'156':28,'159':31,'160':32,'162':34,'163':35,'164':36,'166':38,'167':39,'168':13,'169':41,'171':43,'172':44,'173':45,'174':46,'175':29,'176':48,'177':49,'178':50,'179':51,'180':52,'181':53,'182':54,'183':55,'184':15,'185':57,'187':59,'188':60,'189':61,'190':62,'196':68,'197':69,'198':47,'201':73,'211':83,'213':85,'214':86,'215':87,'216':40,'220':92,'223':95,'228':100,'229':101,'230':63,'233':105,'243':115,'245':117,'246':118,'247':119,'248':56,'252':124,'256':66,'257':98,'260':64,'261':96,'262':67,'263':99,'268':72,'269':104,'274':71,'275':103,'278':75,'279':107,'280':70,'281':102,'290':76,'291':108,'298':78,'299':110,'302':65,'303':97,'310':77,'311':109,'315':79,'316':111,'321':89,'322':121,'323':81,'324':113,'325':82,'326':114,'332':84,'333':116,'342':42,'343':58,'346':90,'347':122,'352':80,'353':112,'362':91,'363':123,'370':88,'371':120,'377':74,'378':106,'379':93,'380':125,'381':94,'382':126,'711':14,'729':127,'731':30,'8211':22,'8212':23,'8216':17,'8217':18,'8218':2,'8220':19,'8221':20,'8222':4,'8224':6,'8225':7,'8226':21,'8230':5,'8240':9,'8249':11,'8250':27,'8364':0,'8482':25};
	var INDEX_BY_POINTER = {'0':'\u20AC','1':'\x81','2':'\u201A','3':'\x83','4':'\u201E','5':'\u2026','6':'\u2020','7':'\u2021','8':'\x88','9':'\u2030','10':'\x8A','11':'\u2039','12':'\x8C','13':'\xA8','14':'\u02C7','15':'\xB8','16':'\x90','17':'\u2018','18':'\u2019','19':'\u201C','20':'\u201D','21':'\u2022','22':'\u2013','23':'\u2014','24':'\x98','25':'\u2122','26':'\x9A','27':'\u203A','28':'\x9C','29':'\xAF','30':'\u02DB','31':'\x9F','32':'\xA0','34':'\xA2','35':'\xA3','36':'\xA4','38':'\xA6','39':'\xA7','40':'\xD8','41':'\xA9','42':'\u0156','43':'\xAB','44':'\xAC','45':'\xAD','46':'\xAE','47':'\xC6','48':'\xB0','49':'\xB1','50':'\xB2','51':'\xB3','52':'\xB4','53':'\xB5','54':'\xB6','55':'\xB7','56':'\xF8','57':'\xB9','58':'\u0157','59':'\xBB','60':'\xBC','61':'\xBD','62':'\xBE','63':'\xE6','64':'\u0104','65':'\u012E','66':'\u0100','67':'\u0106','68':'\xC4','69':'\xC5','70':'\u0118','71':'\u0112','72':'\u010C','73':'\xC9','74':'\u0179','75':'\u0116','76':'\u0122','77':'\u0136','78':'\u012A','79':'\u013B','80':'\u0160','81':'\u0143','82':'\u0145','83':'\xD3','84':'\u014C','85':'\xD5','86':'\xD6','87':'\xD7','88':'\u0172','89':'\u0141','90':'\u015A','91':'\u016A','92':'\xDC','93':'\u017B','94':'\u017D','95':'\xDF','96':'\u0105','97':'\u012F','98':'\u0101','99':'\u0107','100':'\xE4','101':'\xE5','102':'\u0119','103':'\u0113','104':'\u010D','105':'\xE9','106':'\u017A','107':'\u0117','108':'\u0123','109':'\u0137','110':'\u012B','111':'\u013C','112':'\u0161','113':'\u0144','114':'\u0146','115':'\xF3','116':'\u014D','117':'\xF5','118':'\xF6','119':'\xF7','120':'\u0173','121':'\u0142','122':'\u015B','123':'\u016B','124':'\xFC','125':'\u017C','126':'\u017E','127':'\u02D9'};

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

	var windows1257 = {
		'encode': encode,
		'decode': decode,
		'labels': [
			'cp1257',
			'windows-1257',
			'x-cp1257'
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
			return windows1257;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = windows1257;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in windows1257) {
				windows1257.hasOwnProperty(key) && (freeExports[key] = windows1257[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.windows1257 = windows1257;
	}

}(this));
