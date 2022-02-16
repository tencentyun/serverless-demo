"use strict";
(() => {
var exports = {};
exports.id = 30;
exports.ids = [30];
exports.modules = {

/***/ 910:
/***/ ((module) => {

module.exports = require("@authing/nextjs");

/***/ }),

/***/ 4014:
/***/ ((module) => {

module.exports = import("iron-session");;

/***/ }),

/***/ 9593:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "I4": () => (/* binding */ clientId),
/* harmony export */   "Gs": () => (/* binding */ clientSecret),
/* harmony export */   "Ku": () => (/* binding */ appDomain),
/* harmony export */   "Bx": () => (/* binding */ redirectUri),
/* harmony export */   "BX": () => (/* binding */ logoutRedirectUri),
/* harmony export */   "dx": () => (/* binding */ sessionOptions)
/* harmony export */ });
const clientId = process.env.AUTHING_CLIENT_ID || '6200b30e1b2a9e50d17b6d07';
const clientSecret = process.env.AUTHING_CLIENT_SECRET || 'b615bb111b34c79da2f4c5e226aaf856';
const appDomain = process.env.AUTHING_CLIENT_DOMAIN || 'https://tencent-scf-nextjs.authing.cn';
const redirectUri = process.env.AUTHING_REDIRECT_URI || 'https://service-117teepy-1251917473.gz.apigw.tencentcs.com/release/api/callback';
const logoutRedirectUri = process.env.AUTHING_LOGOUT_REDIRECT_URI || 'https://service-117teepy-1251917473.gz.apigw.tencentcs.com/release/';
const sessionOptions = {
    password: process.env.SECRET_COOKIE_PASSWORD || 'authing-nextjs-example-long-password',
    cookieName: 'authing',
    cookieOptions: {
        secure: "production" === 'production'
    }
};


/***/ }),

/***/ 1535:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__) => {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var iron_session_next__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8534);
/* harmony import */ var _authing_nextjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(910);
/* harmony import */ var _authing_nextjs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_authing_nextjs__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9593);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([iron_session_next__WEBPACK_IMPORTED_MODULE_0__]);
iron_session_next__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? await __webpack_async_dependencies__ : __webpack_async_dependencies__)[0];



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,iron_session_next__WEBPACK_IMPORTED_MODULE_0__/* .withIronSessionApiRoute */ .n)((0,_authing_nextjs__WEBPACK_IMPORTED_MODULE_1__.createLogoutApi)({
    appDomain: _config__WEBPACK_IMPORTED_MODULE_2__/* .appDomain */ .Ku,
    redirectUri: _config__WEBPACK_IMPORTED_MODULE_2__/* .logoutRedirectUri */ .BX
}), _config__WEBPACK_IMPORTED_MODULE_2__/* .sessionOptions */ .dx));

});

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [534], () => (__webpack_exec__(1535)));
module.exports = __webpack_exports__;

})();