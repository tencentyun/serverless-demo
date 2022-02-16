"use strict";
exports.id = 531;
exports.ids = [531];
exports.modules = {

/***/ 9531:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__) => {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "c": () => (/* binding */ withIronSessionSsr)
/* harmony export */ });
/* unused harmony export withIronSessionApiRoute */
/* harmony import */ var iron_session__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4014);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([iron_session__WEBPACK_IMPORTED_MODULE_0__]);
iron_session__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? await __webpack_async_dependencies__ : __webpack_async_dependencies__)[0];
// next/index.ts


// src/getPropertyDescriptorForReqSession.ts
function getPropertyDescriptorForReqSession(session) {
  return {
    enumerable: true,
    get() {
      return session;
    },
    set(value) {
      const keys = Object.keys(value);
      const currentKeys = Object.keys(session);
      currentKeys.forEach((key) => {
        if (!keys.includes(key)) {
          delete session[key];
        }
      });
      keys.forEach((key) => {
        session[key] = value[key];
      });
    }
  };
}

// next/index.ts
function withIronSessionApiRoute(handler, options) {
  return async function nextApiHandlerWrappedWithIronSession(req, res) {
    const session = await getIronSession(req, res, options);
    Object.defineProperty(req, "session", getPropertyDescriptorForReqSession(session));
    return handler(req, res);
  };
}
function withIronSessionSsr(handler, options) {
  return async function nextGetServerSidePropsHandlerWrappedWithIronSession(context) {
    const session = await (0,iron_session__WEBPACK_IMPORTED_MODULE_0__.getIronSession)(context.req, context.res, options);
    Object.defineProperty(context.req, "session", getPropertyDescriptorForReqSession(session));
    return handler(context);
  };
}

//# sourceMappingURL=index.mjs.map

});

/***/ })

};
;