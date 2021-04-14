/*! http://mths.be/x-mac-cyrillic v0.1.2 by @mathias | MIT license */
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

	var INDEX_BY_CODE_POINT = {'160':74,'163':35,'167':36,'169':41,'171':71,'172':66,'174':40,'176':33,'177':49,'181':53,'182':38,'187':72,'247':86,'402':68,'1025':93,'1026':43,'1027':46,'1028':56,'1029':65,'1030':39,'1031':58,'1032':55,'1033':60,'1034':62,'1035':75,'1036':77,'1038':88,'1039':90,'1040':0,'1041':1,'1042':2,'1043':3,'1044':4,'1045':5,'1046':6,'1047':7,'1048':8,'1049':9,'1050':10,'1051':11,'1052':12,'1053':13,'1054':14,'1055':15,'1056':16,'1057':17,'1058':18,'1059':19,'1060':20,'1061':21,'1062':22,'1063':23,'1064':24,'1065':25,'1066':26,'1067':27,'1068':28,'1069':29,'1070':30,'1071':31,'1072':96,'1073':97,'1074':98,'1075':99,'1076':100,'1077':101,'1078':102,'1079':103,'1080':104,'1081':105,'1082':106,'1083':107,'1084':108,'1085':109,'1086':110,'1087':111,'1088':112,'1089':113,'1090':114,'1091':115,'1092':116,'1093':117,'1094':118,'1095':119,'1096':120,'1097':121,'1098':122,'1099':123,'1100':124,'1101':125,'1102':126,'1103':95,'1105':94,'1106':44,'1107':47,'1108':57,'1109':79,'1110':52,'1111':59,'1112':64,'1113':61,'1114':63,'1115':76,'1116':78,'1118':89,'1119':91,'1168':34,'1169':54,'8211':80,'8212':81,'8216':84,'8217':85,'8220':82,'8221':83,'8222':87,'8224':32,'8226':37,'8230':73,'8364':127,'8470':92,'8482':42,'8710':70,'8730':67,'8734':48,'8776':69,'8800':45,'8804':50,'8805':51};
	var INDEX_BY_POINTER = {'0':'\u0410','1':'\u0411','2':'\u0412','3':'\u0413','4':'\u0414','5':'\u0415','6':'\u0416','7':'\u0417','8':'\u0418','9':'\u0419','10':'\u041A','11':'\u041B','12':'\u041C','13':'\u041D','14':'\u041E','15':'\u041F','16':'\u0420','17':'\u0421','18':'\u0422','19':'\u0423','20':'\u0424','21':'\u0425','22':'\u0426','23':'\u0427','24':'\u0428','25':'\u0429','26':'\u042A','27':'\u042B','28':'\u042C','29':'\u042D','30':'\u042E','31':'\u042F','32':'\u2020','33':'\xB0','34':'\u0490','35':'\xA3','36':'\xA7','37':'\u2022','38':'\xB6','39':'\u0406','40':'\xAE','41':'\xA9','42':'\u2122','43':'\u0402','44':'\u0452','45':'\u2260','46':'\u0403','47':'\u0453','48':'\u221E','49':'\xB1','50':'\u2264','51':'\u2265','52':'\u0456','53':'\xB5','54':'\u0491','55':'\u0408','56':'\u0404','57':'\u0454','58':'\u0407','59':'\u0457','60':'\u0409','61':'\u0459','62':'\u040A','63':'\u045A','64':'\u0458','65':'\u0405','66':'\xAC','67':'\u221A','68':'\u0192','69':'\u2248','70':'\u2206','71':'\xAB','72':'\xBB','73':'\u2026','74':'\xA0','75':'\u040B','76':'\u045B','77':'\u040C','78':'\u045C','79':'\u0455','80':'\u2013','81':'\u2014','82':'\u201C','83':'\u201D','84':'\u2018','85':'\u2019','86':'\xF7','87':'\u201E','88':'\u040E','89':'\u045E','90':'\u040F','91':'\u045F','92':'\u2116','93':'\u0401','94':'\u0451','95':'\u044F','96':'\u0430','97':'\u0431','98':'\u0432','99':'\u0433','100':'\u0434','101':'\u0435','102':'\u0436','103':'\u0437','104':'\u0438','105':'\u0439','106':'\u043A','107':'\u043B','108':'\u043C','109':'\u043D','110':'\u043E','111':'\u043F','112':'\u0440','113':'\u0441','114':'\u0442','115':'\u0443','116':'\u0444','117':'\u0445','118':'\u0446','119':'\u0447','120':'\u0448','121':'\u0449','122':'\u044A','123':'\u044B','124':'\u044C','125':'\u044D','126':'\u044E','127':'\u20AC'};

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

	var xmaccyrillic = {
		'encode': encode,
		'decode': decode,
		'labels': [
			'x-mac-cyrillic',
			'x-mac-ukrainian'
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
			return xmaccyrillic;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = xmaccyrillic;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in xmaccyrillic) {
				xmaccyrillic.hasOwnProperty(key) && (freeExports[key] = xmaccyrillic[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.xmaccyrillic = xmaccyrillic;
	}

}(this));
