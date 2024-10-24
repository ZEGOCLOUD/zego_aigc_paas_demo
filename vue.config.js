const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'DigitalHuman PaaS Demo'; // 设置标题
      return args;
    });
  },
  configureWebpack: {
    externals: {
      'config': 'root config'
    }
  }
})
