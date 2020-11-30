module.exports = {
  // 云函数模拟入参
  scf: {
    runtime: 'Nodejs8.9',
    handler: 'index.main_handler',
    functionName: 'random' + new Date().getTime(),
    memorySize: '128',
    code:
      '@UEsDBBQACAAIAOMc/0wAAAAAAAAAAAAAAAAIAAAAaW5kZXguanN1jsEKwjAQRO/9iiWXNlCLZ0M9+wceRCSmixbXXUm2Eij9d6v0VpzTMG8YphwSQtLYBy1dgfklUVPz9D1f7p47wggtVPhG1hqCsGL+Gk909eFhod3DWMCsmSUhbEhulTkgkcBRInXGrvBv7U98Miy8wdwnNed1Z3mwgOVFxQNRDWOQDnewnayDYnIfUEsHCGyr/0eLAAAA2gAAAFBLAQItAxQACAAIAOMc/0xsq/9HiwAAANoAAAAIAAAAAAAAAAAAIACkgQAAAABpbmRleC5qc1BLBQYAAAAAAQABADYAAADBAAAAAAA='
  }
}
