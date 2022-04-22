'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const WINDOW_PLUGIN_OPTIONS_KEY = "__GATSBY_PLUGIN_PRISMIC_PREVIEWS_PLUGIN_OPTIONS__";

const onClientEntry = (_gatsbyContext, pluginOptions) => {
  if (typeof window !== "undefined") {
    window[WINDOW_PLUGIN_OPTIONS_KEY] = {
      ...window[WINDOW_PLUGIN_OPTIONS_KEY],
      [pluginOptions.repositoryName]: pluginOptions
    };
    if (pluginOptions.toolbar === "legacy") {
      window.prismic = {
        ...window.prismic,
        endpoint: pluginOptions.apiEndpoint
      };
    }
  }
};

exports.onClientEntry = onClientEntry;
//# sourceMappingURL=gatsby-browser.js.map
