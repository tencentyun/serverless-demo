module.exports = function(tpl,variables) {
  for (let key in variables) {
    const reg = new RegExp('\\$\\{' + key + '\\}', 'g')
    tpl = tpl.replace(reg, variables[key])
  }
  return tpl
}