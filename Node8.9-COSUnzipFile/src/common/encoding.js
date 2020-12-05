const { labels, decode } = require('legacy-encoding')
const { UniversalDetector } = require('jschardet')
const { chain } = require('lodash')
const {
  env: {
    extraEncoding = ''
  }
} = process

const LEGACY_ENCODING_LIST = labels.map(encoding => encoding.toUpperCase())

/**
 * legal encoding list
 * you can expand it by setting environment variable "extraEncoding", separate by ","
 * besides, all UTF and GB encoding in legacy-encoding is supported
 */
const LEGAL_ENCODING_LIST = [
  'BIG5',
  'EUC-JP',
  'SHIFT_JIS',
  'ISO-2022-JP',
  'EUC-KR',
  'ASCII',
  
  ...extraEncoding.split(',')
    .map(encoding => encoding.toUpperCase())
    .filter(encoding => encoding && LEGACY_ENCODING_LIST.includes(encoding)),
  
  ...LEGACY_ENCODING_LIST.filter(encoding => (encoding.includes('UTF') || encoding.includes('GB'))),
]

/**
 * is encoding legal
 */
function isLegal(encoding) {
  return LEGAL_ENCODING_LIST.includes(encoding)
    || LEGAL_ENCODING_LIST.includes(encoding.replace('-', ''))
}

/**
 * expand buffer size to improve encoding detect confidence
 */
function expandBuffer({ buffer, minSize }) {
  const copyTimes = Math.ceil(minSize / buffer.length)
  const bufferList = Array(copyTimes).fill(buffer)
  return Buffer.concat(bufferList)
}

/**
 * get all encoding detect results
 */
function getDetectResults(buffer) {
  const results = []
  const detector = new UniversalDetector()
  buffer = expandBuffer({ buffer, minSize: 300 })
  detector.reset()
  if (typeof Buffer == 'function' && buffer instanceof Buffer) {
    detector.feed(buffer.toString('binary'))
  } else {
    detector.feed(buffer)
  }
  // filter detector._mCharsetProbers to ensure encoding is legal
  detector._mCharsetProbers = detector._mCharsetProbers.filter(prober => {
    try {
      const encoding = `${prober.getCharsetName()}`.toUpperCase()
      const confidence = prober.getConfidence()
      if (isLegal(encoding)) {
        results.push({
          encoding,
          confidence
        })
        return true
      } else {
        return false
      }
    } catch (err) {
      return false
    }
  })
  detector.close()
  // in case of unknown situation, push detector.result to results
  let { encoding, confidence } = detector.result || {}
  encoding = `${encoding}`.toUpperCase()
  if (isLegal(encoding) && confidence) {
    results.push({
      encoding,
      confidence
    })
  }
  return chain(results)
    .sortBy('confidence')
    .reverse()
    .uniqBy('encoding')
    .value()
}

/**
 * get the encoding detect result
 */
function detect(buffer) {
  const results = getDetectResults(buffer)
  const priorityList = results.filter(({ encoding }) => encoding.includes('GB') || encoding.includes('UTF'))
  if (priorityList.length) {
    const { 0: { encoding, confidence } } = priorityList
    if (encoding && confidence > 0.5) {
      return {
        encoding,
        confidence
      }
    }
  }
  if (results.length) {
    const { 0: { encoding, confidence } } = results
    if (encoding && confidence > 0.8) {
      return {
        encoding,
        confidence
      }
    }
  }
  return {
    encoding: 'GB2312',
    confidence: 0
  }
}

module.exports = {
  getDetectResults,
  decode,
  detect
}