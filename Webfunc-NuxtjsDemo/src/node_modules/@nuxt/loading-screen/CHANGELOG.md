# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.3](https://github.com/nuxt/loading-screen/compare/@nuxt/loading-screen@2.0.2...@nuxt/loading-screen@2.0.3) (2020-11-21)


### Bug Fixes

* mixed esm syntax in utils ([41a6eda](https://github.com/nuxt/loading-screen/commit/41a6edabec305b745d79a3d94fc46ad3a4c1ead1))





## [2.0.2](https://github.com/nuxt/loading-screen/compare/@nuxt/loading-screen@2.0.1...@nuxt/loading-screen@2.0.2) (2020-06-25)


### Bug Fixes

* **module:** set default value for baseURLAlt ([dbd3b29](https://github.com/nuxt/loading-screen/commit/dbd3b29327bf0b856f8364e4a060e4d0f26d38b3))





## [2.0.1](https://github.com/nuxt/loading-screen/compare/@nuxt/loading-screen@2.0.0...@nuxt/loading-screen@2.0.1) (2020-06-24)


### Bug Fixes

* disable altPort by default ([fb344b3](https://github.com/nuxt/loading-screen/commit/fb344b374b7722d998b7bb19ae05428c29ef7a8d))





# 2.0.0 (2020-06-18)


### Bug Fixes

* {STATE} was being interpolated by poi ([69955ff](https://github.com/nuxt/loading-screen/commit/69955ff334fcc25229ab2ad16825e54c52f69a34))
* getPort import ([f04edfe](https://github.com/nuxt/loading-screen/commit/f04edfe413f1c4e2ccb306c727a1c7d0a5a81f1a))
* lazy listen and redirect users directly opening port ([cdb0b04](https://github.com/nuxt/loading-screen/commit/cdb0b042ed069f95aaddcac5af07fe9ea48b5e18))


### Features

* allow customisation with options ([#57](https://github.com/nuxt/loading-screen/issues/57)) ([ee40ac5](https://github.com/nuxt/loading-screen/commit/ee40ac52e5f69c3fbfb5515fcf92975bd6b3a30e)), closes [#43](https://github.com/nuxt/loading-screen/issues/43)
* altPort option and disable for codesandbox ([f176eb3](https://github.com/nuxt/loading-screen/commit/f176eb3abe9cb05711cf75951c9293dce633ae2c))
* listen on new port ([#60](https://github.com/nuxt/loading-screen/issues/60)) ([119a032](https://github.com/nuxt/loading-screen/commit/119a032cc3d3ac17e540aabd093a61d46b9dae81))
* use baseURLAlt only for SSE ([9f27089](https://github.com/nuxt/loading-screen/commit/9f27089933b2cee45d246987393faefe78be71fb))


### BREAKING CHANGES

* no longer adding serverMiddleware





# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.2.0](https://github.com/nuxt/loading-screen/compare/v1.1.0...v1.2.0) (2019-10-01)


### Bug Fixes

* ensure EventSource is supported in current browser ([ee4b180](https://github.com/nuxt/loading-screen/commit/ee4b180))
* typo in var name ([#47](https://github.com/nuxt/loading-screen/issues/47)) ([e47885a](https://github.com/nuxt/loading-screen/commit/e47885a))


### Features

* show build error ([#45](https://github.com/nuxt/loading-screen/issues/45)) ([9f23404](https://github.com/nuxt/loading-screen/commit/9f23404))

## [1.1.0](https://github.com/nuxt/loading-screen/compare/v1.0.1...v1.1.0) (2019-09-21)


### Features

* prevent endless reloading ([#44](https://github.com/nuxt/loading-screen/issues/44)) ([260dd61](https://github.com/nuxt/loading-screen/commit/260dd61))

### [1.0.1](https://github.com/nuxt/loading-screen/compare/v1.0.0...v1.0.1) (2019-08-20)


### Bug Fixes

* set `Content-Type` of for index page ([#38](https://github.com/nuxt/loading-screen/issues/38)) ([ad9051c](https://github.com/nuxt/loading-screen/commit/ad9051c))

## [1.0.0](https://github.com/nuxt/loading-screen/compare/v0.5.2...v1.0.0) (2019-08-05)


### ⚠ BREAKING CHANGES

* /ws endpoint changed to /sse

### Bug Fixes

* missing underscore in reloading var ([#22](https://github.com/nuxt/loading-screen/issues/22)) ([3295e15](https://github.com/nuxt/loading-screen/commit/3295e15))


### Features

* switch from WebSocket to EventSource ([#34](https://github.com/nuxt/loading-screen/issues/34)) ([68ea10e](https://github.com/nuxt/loading-screen/commit/68ea10e))

## [0.5.2](https://github.com/nuxt/loading-screen/compare/v0.5.1...v0.5.2) (2019-05-01)


### Bug Fixes

* **ws:** wsReconnect timeout ([#16](https://github.com/nuxt/loading-screen/issues/16)) ([27a974d](https://github.com/nuxt/loading-screen/commit/27a974d))



## [0.5.1](https://github.com/nuxt/loading-screen/compare/v0.5.0...v0.5.1) (2019-04-26)


### Bug Fixes

* **style:** make `progress_bar` width responsive ([#14](https://github.com/nuxt/loading-screen/issues/14)) ([a52089a](https://github.com/nuxt/loading-screen/commit/a52089a))



# [0.5.0](https://github.com/nuxt/loading-screen/compare/v0.4.1...v0.5.0) (2019-04-24)


### Features

* always reload ([32b57a8](https://github.com/nuxt/loading-screen/commit/32b57a8))



## [0.4.1](https://github.com/nuxt/loading-screen/compare/v0.4.0...v0.4.1) (2019-04-24)


### Bug Fixes

* _closed guard ([b7f3b3e](https://github.com/nuxt/loading-screen/commit/b7f3b3e))
* use unique top level selector ([4f8811e](https://github.com/nuxt/loading-screen/commit/4f8811e))
* workaround for duplicate instance ([a6dd5a7](https://github.com/nuxt/loading-screen/commit/a6dd5a7))



# [0.4.0](https://github.com/nuxt/loading-screen/compare/v0.3.1...v0.4.0) (2019-04-24)


### Features

* improved `showNuxtApp` ([6fb1fa6](https://github.com/nuxt/loading-screen/commit/6fb1fa6))



## [0.3.1](https://github.com/nuxt/loading-screen/compare/v0.3.0...v0.3.1) (2019-04-24)


### Bug Fixes

* stop requesting before replacing document ([441d3cd](https://github.com/nuxt/loading-screen/commit/441d3cd))



# [0.3.0](https://github.com/nuxt/loading-screen/compare/v0.2.0...v0.3.0) (2019-04-09)


### Features

* improve loading and error handling ([6316379](https://github.com/nuxt/loading-screen/commit/6316379)), closes [#9](https://github.com/nuxt/loading-screen/issues/9)
* support baseURL ([#8](https://github.com/nuxt/loading-screen/issues/8)) ([583012c](https://github.com/nuxt/loading-screen/commit/583012c))



# [0.2.0](https://github.com/nuxt/loading-screen/compare/v0.1.3...v0.2.0) (2019-03-23)


### Features

* fallback to fetch if ws timesout ([#6](https://github.com/nuxt/loading-screen/issues/6)) ([46bd50a](https://github.com/nuxt/loading-screen/commit/46bd50a))



## [0.1.3](https://github.com/nuxt/loading-screen/compare/v0.1.2...v0.1.3) (2019-03-22)


### Bug Fixes

* use wss for https ([#4](https://github.com/nuxt/loading-screen/issues/4)) ([eeb85eb](https://github.com/nuxt/loading-screen/commit/eeb85eb))



## [0.1.2](https://github.com/nuxt/loading-screen/compare/v0.1.1...v0.1.2) (2019-03-20)


### Performance Improvements

* prevent duplicate allDone getter calls ([0cb31cd](https://github.com/nuxt/loading-screen/commit/0cb31cd))



## [0.1.1](https://github.com/nuxt/loading-screen/compare/v0.1.0...v0.1.1) (2019-03-20)


### Performance Improvements

* throttle ws broadcast ([3069cb9](https://github.com/nuxt/loading-screen/commit/3069cb9))



# [0.1.0](https://github.com/nuxt/loading-screen/compare/v0.0.2...v0.1.0) (2019-03-20)


### Bug Fixes

* **app:** don't update wsURL when retry ([c7e0ed0](https://github.com/nuxt/loading-screen/commit/c7e0ed0))
* **app:** Remove logging and don't finish is not bundle is given as first message ([031271d](https://github.com/nuxt/loading-screen/commit/031271d))
* **poi:** set html.template option ([ce72848](https://github.com/nuxt/loading-screen/commit/ce72848))
* correctly handle ws upgrade events on server ([4ba32a2](https://github.com/nuxt/loading-screen/commit/4ba32a2))


### Features

* SSR initial state ([9982c9e](https://github.com/nuxt/loading-screen/commit/9982c9e))



## 0.0.1 (2019-03-16)
