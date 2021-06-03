var extname = require('path').extname
var calculate = require('etag')
var fs = require('mz/fs')

var notfound = {
  ENOENT: true,
  ENAMETOOLONG: true,
  ENOTDIR: true,
}

module.exports = function sendfile(ctx, path) {
  return fs.stat(path)
  .then(function(stats){
    if (!stats) return null
    if (!stats.isFile()) return stats

    ctx.response.status = 200
    ctx.response.lastModified = stats.mtime
    ctx.response.length = stats.size
    ctx.response.type = extname(path)
    if (!ctx.response.etag) ctx.response.etag = calculate(stats, {
      weak: true
    })

    // fresh based solely on last-modified
    var fresh = ctx.request.fresh
    switch (ctx.request.method) {
      case 'HEAD':
        ctx.response.status = fresh ? 304 : 200
        break
      case 'GET':
        if (fresh) {
          ctx.response.status = 304
        } else {
          ctx.body = fs.createReadStream(path)
        }
        break
    }

    return stats
  }, onstaterror);
}

function onstaterror(err) {
  if (notfound[err.code]) return
  err.status = 500
  throw err
}
