/*! http://mths.be/koi8-r v0.1.2 by @mathias | MIT license */
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

	var INDEX_BY_CODE_POINT = {'160':26,'169':63,'176':28,'178':29,'183':30,'247':31,'1025':51,'1040':97,'1041':98,'1042':119,'1043':103,'1044':100,'1045':101,'1046':118,'1047':122,'1048':105,'1049':106,'1050':107,'1051':108,'1052':109,'1053':110,'1054':111,'1055':112,'1056':114,'1057':115,'1058':116,'1059':117,'1060':102,'1061':104,'1062':99,'1063':126,'1064':123,'1065':125,'1066':127,'1067':121,'1068':120,'1069':124,'1070':96,'1071':113,'1072':65,'1073':66,'1074':87,'1075':71,'1076':68,'1077':69,'1078':86,'1079':90,'1080':73,'1081':74,'1082':75,'1083':76,'1084':77,'1085':78,'1086':79,'1087':80,'1088':82,'1089':83,'1090':84,'1091':85,'1092':70,'1093':72,'1094':67,'1095':94,'1096':91,'1097':93,'1098':95,'1099':89,'1100':88,'1101':92,'1102':64,'1103':81,'1105':35,'8729':21,'8730':22,'8776':23,'8804':24,'8805':25,'8992':19,'8993':27,'9472':0,'9474':1,'9484':2,'9488':3,'9492':4,'9496':5,'9500':6,'9508':7,'9516':8,'9524':9,'9532':10,'9552':32,'9553':33,'9554':34,'9555':36,'9556':37,'9557':38,'9558':39,'9559':40,'9560':41,'9561':42,'9562':43,'9563':44,'9564':45,'9565':46,'9566':47,'9567':48,'9568':49,'9569':50,'9570':52,'9571':53,'9572':54,'9573':55,'9574':56,'9575':57,'9576':58,'9577':59,'9578':60,'9579':61,'9580':62,'9600':11,'9604':12,'9608':13,'9612':14,'9616':15,'9617':16,'9618':17,'9619':18,'9632':20};
	var INDEX_BY_POINTER = {'0':'\u2500','1':'\u2502','2':'\u250C','3':'\u2510','4':'\u2514','5':'\u2518','6':'\u251C','7':'\u2524','8':'\u252C','9':'\u2534','10':'\u253C','11':'\u2580','12':'\u2584','13':'\u2588','14':'\u258C','15':'\u2590','16':'\u2591','17':'\u2592','18':'\u2593','19':'\u2320','20':'\u25A0','21':'\u2219','22':'\u221A','23':'\u2248','24':'\u2264','25':'\u2265','26':'\xA0','27':'\u2321','28':'\xB0','29':'\xB2','30':'\xB7','31':'\xF7','32':'\u2550','33':'\u2551','34':'\u2552','35':'\u0451','36':'\u2553','37':'\u2554','38':'\u2555','39':'\u2556','40':'\u2557','41':'\u2558','42':'\u2559','43':'\u255A','44':'\u255B','45':'\u255C','46':'\u255D','47':'\u255E','48':'\u255F','49':'\u2560','50':'\u2561','51':'\u0401','52':'\u2562','53':'\u2563','54':'\u2564','55':'\u2565','56':'\u2566','57':'\u2567','58':'\u2568','59':'\u2569','60':'\u256A','61':'\u256B','62':'\u256C','63':'\xA9','64':'\u044E','65':'\u0430','66':'\u0431','67':'\u0446','68':'\u0434','69':'\u0435','70':'\u0444','71':'\u0433','72':'\u0445','73':'\u0438','74':'\u0439','75':'\u043A','76':'\u043B','77':'\u043C','78':'\u043D','79':'\u043E','80':'\u043F','81':'\u044F','82':'\u0440','83':'\u0441','84':'\u0442','85':'\u0443','86':'\u0436','87':'\u0432','88':'\u044C','89':'\u044B','90':'\u0437','91':'\u0448','92':'\u044D','93':'\u0449','94':'\u0447','95':'\u044A','96':'\u042E','97':'\u0410','98':'\u0411','99':'\u0426','100':'\u0414','101':'\u0415','102':'\u0424','103':'\u0413','104':'\u0425','105':'\u0418','106':'\u0419','107':'\u041A','108':'\u041B','109':'\u041C','110':'\u041D','111':'\u041E','112':'\u041F','113':'\u042F','114':'\u0420','115':'\u0421','116':'\u0422','117':'\u0423','118':'\u0416','119':'\u0412','120':'\u042C','121':'\u042B','122':'\u0417','123':'\u0428','124':'\u042D','125':'\u0429','126':'\u0427','127':'\u042A'};

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

	var koi8r = {
		'encode': encode,
		'decode': decode,
		'labels': [
			'cskoi8r',
			'koi',
			'koi8',
			'koi8-r',
			'koi8_r'
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
			return koi8r;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = koi8r;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in koi8r) {
				koi8r.hasOwnProperty(key) && (freeExports[key] = koi8r[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.koi8r = koi8r;
	}

}(this));
