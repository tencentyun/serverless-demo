/*! http://mths.be/iso-8859-5 v0.1.2 by @mathias | MIT license */
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

	var INDEX_BY_CODE_POINT = {'128':0,'129':1,'130':2,'131':3,'132':4,'133':5,'134':6,'135':7,'136':8,'137':9,'138':10,'139':11,'140':12,'141':13,'142':14,'143':15,'144':16,'145':17,'146':18,'147':19,'148':20,'149':21,'150':22,'151':23,'152':24,'153':25,'154':26,'155':27,'156':28,'157':29,'158':30,'159':31,'160':32,'167':125,'173':45,'1025':33,'1026':34,'1027':35,'1028':36,'1029':37,'1030':38,'1031':39,'1032':40,'1033':41,'1034':42,'1035':43,'1036':44,'1038':46,'1039':47,'1040':48,'1041':49,'1042':50,'1043':51,'1044':52,'1045':53,'1046':54,'1047':55,'1048':56,'1049':57,'1050':58,'1051':59,'1052':60,'1053':61,'1054':62,'1055':63,'1056':64,'1057':65,'1058':66,'1059':67,'1060':68,'1061':69,'1062':70,'1063':71,'1064':72,'1065':73,'1066':74,'1067':75,'1068':76,'1069':77,'1070':78,'1071':79,'1072':80,'1073':81,'1074':82,'1075':83,'1076':84,'1077':85,'1078':86,'1079':87,'1080':88,'1081':89,'1082':90,'1083':91,'1084':92,'1085':93,'1086':94,'1087':95,'1088':96,'1089':97,'1090':98,'1091':99,'1092':100,'1093':101,'1094':102,'1095':103,'1096':104,'1097':105,'1098':106,'1099':107,'1100':108,'1101':109,'1102':110,'1103':111,'1105':113,'1106':114,'1107':115,'1108':116,'1109':117,'1110':118,'1111':119,'1112':120,'1113':121,'1114':122,'1115':123,'1116':124,'1118':126,'1119':127,'8470':112};
	var INDEX_BY_POINTER = {'0':'\x80','1':'\x81','2':'\x82','3':'\x83','4':'\x84','5':'\x85','6':'\x86','7':'\x87','8':'\x88','9':'\x89','10':'\x8A','11':'\x8B','12':'\x8C','13':'\x8D','14':'\x8E','15':'\x8F','16':'\x90','17':'\x91','18':'\x92','19':'\x93','20':'\x94','21':'\x95','22':'\x96','23':'\x97','24':'\x98','25':'\x99','26':'\x9A','27':'\x9B','28':'\x9C','29':'\x9D','30':'\x9E','31':'\x9F','32':'\xA0','33':'\u0401','34':'\u0402','35':'\u0403','36':'\u0404','37':'\u0405','38':'\u0406','39':'\u0407','40':'\u0408','41':'\u0409','42':'\u040A','43':'\u040B','44':'\u040C','45':'\xAD','46':'\u040E','47':'\u040F','48':'\u0410','49':'\u0411','50':'\u0412','51':'\u0413','52':'\u0414','53':'\u0415','54':'\u0416','55':'\u0417','56':'\u0418','57':'\u0419','58':'\u041A','59':'\u041B','60':'\u041C','61':'\u041D','62':'\u041E','63':'\u041F','64':'\u0420','65':'\u0421','66':'\u0422','67':'\u0423','68':'\u0424','69':'\u0425','70':'\u0426','71':'\u0427','72':'\u0428','73':'\u0429','74':'\u042A','75':'\u042B','76':'\u042C','77':'\u042D','78':'\u042E','79':'\u042F','80':'\u0430','81':'\u0431','82':'\u0432','83':'\u0433','84':'\u0434','85':'\u0435','86':'\u0436','87':'\u0437','88':'\u0438','89':'\u0439','90':'\u043A','91':'\u043B','92':'\u043C','93':'\u043D','94':'\u043E','95':'\u043F','96':'\u0440','97':'\u0441','98':'\u0442','99':'\u0443','100':'\u0444','101':'\u0445','102':'\u0446','103':'\u0447','104':'\u0448','105':'\u0449','106':'\u044A','107':'\u044B','108':'\u044C','109':'\u044D','110':'\u044E','111':'\u044F','112':'\u2116','113':'\u0451','114':'\u0452','115':'\u0453','116':'\u0454','117':'\u0455','118':'\u0456','119':'\u0457','120':'\u0458','121':'\u0459','122':'\u045A','123':'\u045B','124':'\u045C','125':'\xA7','126':'\u045E','127':'\u045F'};

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

	var iso88595 = {
		'encode': encode,
		'decode': decode,
		'labels': [
			'csisolatincyrillic',
			'cyrillic',
			'iso-8859-5',
			'iso-ir-144',
			'iso8859-5',
			'iso88595',
			'iso_8859-5',
			'iso_8859-5:1988'
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
			return iso88595;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = iso88595;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in iso88595) {
				iso88595.hasOwnProperty(key) && (freeExports[key] = iso88595[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.iso88595 = iso88595;
	}

}(this));
