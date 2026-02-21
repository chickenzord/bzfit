// Custom Metro transformer that handles .md files as importable text modules.
// All other file types are delegated to the default Expo Babel transformer.
const upstreamTransformer = require('@expo/metro-config/build/babel-transformer');

module.exports = {
  ...upstreamTransformer,
  async transform(params) {
    if (params.filename.endsWith('.md')) {
      return upstreamTransformer.transform({
        ...params,
        src: `module.exports = ${JSON.stringify(params.src)};`,
      });
    }
    return upstreamTransformer.transform(params);
  },
};
