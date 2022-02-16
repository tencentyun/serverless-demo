"use strict";
(() => {
var exports = {};
exports.id = 968;
exports.ids = [968];
exports.modules = {

/***/ 1838:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "dx": () => (/* binding */ sessionOptions)
/* harmony export */ });
/* unused harmony exports clientId, clientSecret, appDomain, redirectUri, logoutRedirectUri */
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

/***/ 9874:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__) => {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ SsrProfile),
/* harmony export */   "getServerSideProps": () => (/* binding */ getServerSideProps)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1664);
/* harmony import */ var iron_session_next__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9531);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(1838);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([iron_session_next__WEBPACK_IMPORTED_MODULE_2__]);
iron_session_next__WEBPACK_IMPORTED_MODULE_2__ = (__webpack_async_dependencies__.then ? await __webpack_async_dependencies__ : __webpack_async_dependencies__)[0];




function SsrProfile({ user  }) {
    return(/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("nav", {
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(next_link__WEBPACK_IMPORTED_MODULE_1__["default"], {
                        href: "/ssg",
                        children: "SSG"
                    }),
                    " | ",
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(next_link__WEBPACK_IMPORTED_MODULE_1__["default"], {
                        href: "/api/logout",
                        children: "Logout"
                    })
                ]
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("pre", {
                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("code", {
                    children: JSON.stringify(user, null, 2)
                })
            })
        ]
    }));
};
const getServerSideProps = (0,iron_session_next__WEBPACK_IMPORTED_MODULE_2__/* .withIronSessionSsr */ .c)(async function({ req , res  }) {
    const user = req.session.user;
    if (user === undefined) {
        res.setHeader('location', '/api/login');
        res.statusCode = 302;
        res.end();
        return {
            props: {
                user: {
                    isLoggedIn: false
                }
            }
        };
    }
    return {
        props: {
            user: req.session.user
        }
    };
}, _config__WEBPACK_IMPORTED_MODULE_3__/* .sessionOptions */ .dx);

});

/***/ }),

/***/ 562:
/***/ ((module) => {

module.exports = require("next/dist/server/denormalize-page-path.js");

/***/ }),

/***/ 1925:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/i18n/normalize-locale-path.js");

/***/ }),

/***/ 8524:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/is-plain-object.js");

/***/ }),

/***/ 8020:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/mitt.js");

/***/ }),

/***/ 4964:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router-context.js");

/***/ }),

/***/ 9565:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/get-asset-path-from-route.js");

/***/ }),

/***/ 4365:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/get-middleware-regex.js");

/***/ }),

/***/ 1428:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/is-dynamic.js");

/***/ }),

/***/ 1292:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/parse-relative-url.js");

/***/ }),

/***/ 979:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/querystring.js");

/***/ }),

/***/ 6052:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/resolve-rewrites.js");

/***/ }),

/***/ 4226:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/route-matcher.js");

/***/ }),

/***/ 5052:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/router/utils/route-regex.js");

/***/ }),

/***/ 9232:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/utils.js");

/***/ }),

/***/ 6689:
/***/ ((module) => {

module.exports = require("react");

/***/ }),

/***/ 997:
/***/ ((module) => {

module.exports = require("react/jsx-runtime");

/***/ }),

/***/ 4014:
/***/ ((module) => {

module.exports = import("iron-session");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [730,664,531], () => (__webpack_exec__(9874)));
module.exports = __webpack_exports__;

})();