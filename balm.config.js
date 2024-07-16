const api = (mix) => {
  console.log("执行bale.config.js")
  if (mix.env.isDev) {
    mix.copy("node_modules/balm-ui/fonts/*", "src/styles/fonts");
  }
};
