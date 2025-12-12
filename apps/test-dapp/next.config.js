//@ts-check
const { composePlugins, withNx } = require("@nx/next");

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Ensure Nx doesn't override our optimization settings
    svgr: false,
  },
  // Disable code minimization and compression
  optimization: {
    compress: false,
    minimize: false,
    swcMinify: false,
  },
  // Ensure webpack doesn't minimize or compress
  webpack: (config, { dev, isServer }) => {
    // Disable minimization regardless of environment
    config.optimization.minimize = false;

    if (config.optimization.minimizer) {
      config.optimization.minimizer = [];
    }

    return config;
  },
};

// Define custom plugin to ensure optimization settings aren't overridden
const withNoMinimize = (nextConfig) => {
  return {
    ...nextConfig,
    webpack: (config, options) => {
      // Call the user's webpack function if it exists
      const userWebpack = nextConfig.webpack;
      const resultConfig = userWebpack ? userWebpack(config, options) : config;

      // Ensure minimization is disabled
      resultConfig.optimization.minimize = false;
      resultConfig.optimization.minimizer = [];

      return resultConfig;
    },
  };
};

const plugins = [withNoMinimize, withNx];

module.exports = composePlugins(...plugins)(nextConfig);
