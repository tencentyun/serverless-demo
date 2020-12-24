module.exports = function(tpl,variables) {
    return tpl.replace(/(\${([\w]+)})/g,(_,g1,g2)=>{
        return variables[g2] || g1
    })
  }