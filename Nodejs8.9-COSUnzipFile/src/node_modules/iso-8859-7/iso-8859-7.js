/*! http://mths.be/iso-8859-7 v0.1.2 by @mathias | MIT license */
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

	var INDEX_BY_CODE_POINT = {'128':0,'129':1,'130':2,'131':3,'132':4,'133':5,'134':6,'135':7,'136':8,'137':9,'138':10,'139':11,'140':12,'141':13,'142':14,'143':15,'144':16,'145':17,'146':18,'147':19,'148':20,'149':21,'150':22,'151':23,'152':24,'153':25,'154':26,'155':27,'156':28,'157':29,'158':30,'159':31,'160':32,'163':35,'166':38,'167':39,'168':40,'169':41,'171':43,'172':44,'173':45,'176':48,'177':49,'178':50,'179':51,'183':55,'187':59,'189':61,'890':42,'900':52,'901':53,'902':54,'904':56,'905':57,'906':58,'908':60,'910':62,'911':63,'912':64,'913':65,'914':66,'915':67,'916':68,'917':69,'918':70,'919':71,'920':72,'921':73,'922':74,'923':75,'924':76,'925':77,'926':78,'927':79,'928':80,'929':81,'931':83,'932':84,'933':85,'934':86,'935':87,'936':88,'937':89,'938':90,'939':91,'940':92,'941':93,'942':94,'943':95,'944':96,'945':97,'946':98,'947':99,'948':100,'949':101,'950':102,'951':103,'952':104,'953':105,'954':106,'955':107,'956':108,'957':109,'958':110,'959':111,'960':112,'961':113,'962':114,'963':115,'964':116,'965':117,'966':118,'967':119,'968':120,'969':121,'970':122,'971':123,'972':124,'973':125,'974':126,'8213':47,'8216':33,'8217':34,'8364':36,'8367':37};
	var INDEX_BY_POINTER = {'0':'\x80','1':'\x81','2':'\x82','3':'\x83','4':'\x84','5':'\x85','6':'\x86','7':'\x87','8':'\x88','9':'\x89','10':'\x8A','11':'\x8B','12':'\x8C','13':'\x8D','14':'\x8E','15':'\x8F','16':'\x90','17':'\x91','18':'\x92','19':'\x93','20':'\x94','21':'\x95','22':'\x96','23':'\x97','24':'\x98','25':'\x99','26':'\x9A','27':'\x9B','28':'\x9C','29':'\x9D','30':'\x9E','31':'\x9F','32':'\xA0','33':'\u2018','34':'\u2019','35':'\xA3','36':'\u20AC','37':'\u20AF','38':'\xA6','39':'\xA7','40':'\xA8','41':'\xA9','42':'\u037A','43':'\xAB','44':'\xAC','45':'\xAD','47':'\u2015','48':'\xB0','49':'\xB1','50':'\xB2','51':'\xB3','52':'\u0384','53':'\u0385','54':'\u0386','55':'\xB7','56':'\u0388','57':'\u0389','58':'\u038A','59':'\xBB','60':'\u038C','61':'\xBD','62':'\u038E','63':'\u038F','64':'\u0390','65':'\u0391','66':'\u0392','67':'\u0393','68':'\u0394','69':'\u0395','70':'\u0396','71':'\u0397','72':'\u0398','73':'\u0399','74':'\u039A','75':'\u039B','76':'\u039C','77':'\u039D','78':'\u039E','79':'\u039F','80':'\u03A0','81':'\u03A1','83':'\u03A3','84':'\u03A4','85':'\u03A5','86':'\u03A6','87':'\u03A7','88':'\u03A8','89':'\u03A9','90':'\u03AA','91':'\u03AB','92':'\u03AC','93':'\u03AD','94':'\u03AE','95':'\u03AF','96':'\u03B0','97':'\u03B1','98':'\u03B2','99':'\u03B3','100':'\u03B4','101':'\u03B5','102':'\u03B6','103':'\u03B7','104':'\u03B8','105':'\u03B9','106':'\u03BA','107':'\u03BB','108':'\u03BC','109':'\u03BD','110':'\u03BE','111':'\u03BF','112':'\u03C0','113':'\u03C1','114':'\u03C2','115':'\u03C3','116':'\u03C4','117':'\u03C5','118':'\u03C6','119':'\u03C7','120':'\u03C8','121':'\u03C9','122':'\u03CA','123':'\u03CB','124':'\u03CC','125':'\u03CD','126':'\u03CE'};

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

	var iso88597 = {
		'encode': encode,
		'decode': decode,
		'labels': [
			'csisolatingreek',
			'ecma-118',
			'elot_928',
			'greek',
			'greek8',
			'iso-8859-7',
			'iso-ir-126',
			'iso8859-7',
			'iso88597',
			'iso_8859-7',
			'iso_8859-7:1987',
			'sun_eu_greek'
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
			return iso88597;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = iso88597;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in iso88597) {
				iso88597.hasOwnProperty(key) && (freeExports[key] = iso88597[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.iso88597 = iso88597;
	}

}(this));
