/*! http://mths.be/windows-1251 v0.1.2 by @mathias | MIT license */
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

	var INDEX_BY_CODE_POINT = {'152':24,'160':32,'164':36,'166':38,'167':39,'169':41,'171':43,'172':44,'173':45,'174':46,'176':48,'177':49,'181':53,'182':54,'183':55,'187':59,'1025':40,'1026':0,'1027':1,'1028':42,'1029':61,'1030':50,'1031':47,'1032':35,'1033':10,'1034':12,'1035':14,'1036':13,'1038':33,'1039':15,'1040':64,'1041':65,'1042':66,'1043':67,'1044':68,'1045':69,'1046':70,'1047':71,'1048':72,'1049':73,'1050':74,'1051':75,'1052':76,'1053':77,'1054':78,'1055':79,'1056':80,'1057':81,'1058':82,'1059':83,'1060':84,'1061':85,'1062':86,'1063':87,'1064':88,'1065':89,'1066':90,'1067':91,'1068':92,'1069':93,'1070':94,'1071':95,'1072':96,'1073':97,'1074':98,'1075':99,'1076':100,'1077':101,'1078':102,'1079':103,'1080':104,'1081':105,'1082':106,'1083':107,'1084':108,'1085':109,'1086':110,'1087':111,'1088':112,'1089':113,'1090':114,'1091':115,'1092':116,'1093':117,'1094':118,'1095':119,'1096':120,'1097':121,'1098':122,'1099':123,'1100':124,'1101':125,'1102':126,'1103':127,'1105':56,'1106':16,'1107':3,'1108':58,'1109':62,'1110':51,'1111':63,'1112':60,'1113':26,'1114':28,'1115':30,'1116':29,'1118':34,'1119':31,'1168':37,'1169':52,'8211':22,'8212':23,'8216':17,'8217':18,'8218':2,'8220':19,'8221':20,'8222':4,'8224':6,'8225':7,'8226':21,'8230':5,'8240':9,'8249':11,'8250':27,'8364':8,'8470':57,'8482':25};
	var INDEX_BY_POINTER = {'0':'\u0402','1':'\u0403','2':'\u201A','3':'\u0453','4':'\u201E','5':'\u2026','6':'\u2020','7':'\u2021','8':'\u20AC','9':'\u2030','10':'\u0409','11':'\u2039','12':'\u040A','13':'\u040C','14':'\u040B','15':'\u040F','16':'\u0452','17':'\u2018','18':'\u2019','19':'\u201C','20':'\u201D','21':'\u2022','22':'\u2013','23':'\u2014','24':'\x98','25':'\u2122','26':'\u0459','27':'\u203A','28':'\u045A','29':'\u045C','30':'\u045B','31':'\u045F','32':'\xA0','33':'\u040E','34':'\u045E','35':'\u0408','36':'\xA4','37':'\u0490','38':'\xA6','39':'\xA7','40':'\u0401','41':'\xA9','42':'\u0404','43':'\xAB','44':'\xAC','45':'\xAD','46':'\xAE','47':'\u0407','48':'\xB0','49':'\xB1','50':'\u0406','51':'\u0456','52':'\u0491','53':'\xB5','54':'\xB6','55':'\xB7','56':'\u0451','57':'\u2116','58':'\u0454','59':'\xBB','60':'\u0458','61':'\u0405','62':'\u0455','63':'\u0457','64':'\u0410','65':'\u0411','66':'\u0412','67':'\u0413','68':'\u0414','69':'\u0415','70':'\u0416','71':'\u0417','72':'\u0418','73':'\u0419','74':'\u041A','75':'\u041B','76':'\u041C','77':'\u041D','78':'\u041E','79':'\u041F','80':'\u0420','81':'\u0421','82':'\u0422','83':'\u0423','84':'\u0424','85':'\u0425','86':'\u0426','87':'\u0427','88':'\u0428','89':'\u0429','90':'\u042A','91':'\u042B','92':'\u042C','93':'\u042D','94':'\u042E','95':'\u042F','96':'\u0430','97':'\u0431','98':'\u0432','99':'\u0433','100':'\u0434','101':'\u0435','102':'\u0436','103':'\u0437','104':'\u0438','105':'\u0439','106':'\u043A','107':'\u043B','108':'\u043C','109':'\u043D','110':'\u043E','111':'\u043F','112':'\u0440','113':'\u0441','114':'\u0442','115':'\u0443','116':'\u0444','117':'\u0445','118':'\u0446','119':'\u0447','120':'\u0448','121':'\u0449','122':'\u044A','123':'\u044B','124':'\u044C','125':'\u044D','126':'\u044E','127':'\u044F'};

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

	var windows1251 = {
		'encode': encode,
		'decode': decode,
		'labels': [
			'cp1251',
			'windows-1251',
			'x-cp1251'
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
			return windows1251;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = windows1251;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in windows1251) {
				windows1251.hasOwnProperty(key) && (freeExports[key] = windows1251[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.windows1251 = windows1251;
	}

}(this));
