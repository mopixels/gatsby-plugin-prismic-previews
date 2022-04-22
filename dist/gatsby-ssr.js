'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const React = require('react');

function _interopNamespace(e) {
	if (e && e.__esModule) return e;
	const n = Object.create(null);
	if (e) {
		for (const k in e) {
			if (k !== 'default') {
				const d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(n, k, d.get ? d : {
					enumerable: true,
					get: function () { return e[k]; }
				});
			}
		}
	}
	n["default"] = e;
	return Object.freeze(n);
}

const React__namespace = /*#__PURE__*/_interopNamespace(React);

const getToolbarScriptURL = (repositoryName, type) => {
  const url = new URL(`https://static.cdn.prismic.io/prismic.js`);
  url.searchParams.set("repo", repositoryName);
  if (type === "new") {
    url.searchParams.set("new", "true");
    return url;
  } else {
    return url;
  }
};
const onRenderBody = async (gatsbyContext, pluginOptions) => {
  const toolbarScriptUrl = getToolbarScriptURL(pluginOptions.repositoryName, pluginOptions.toolbar);
  gatsbyContext.setHeadComponents([
    /* @__PURE__ */ React__namespace.createElement("link", {
      rel: "preconnect",
      key: "preconnect-prismic-toolbar",
      href: toolbarScriptUrl.origin
    }),
    /* @__PURE__ */ React__namespace.createElement("link", {
      rel: "dns-prefetch",
      key: "dns-prefetch-prismic-toolbar",
      href: toolbarScriptUrl.origin
    })
  ]);
  gatsbyContext.setPostBodyComponents([
    /* @__PURE__ */ React__namespace.createElement("script", {
      src: toolbarScriptUrl.href,
      defer: true,
      key: `prismic-toolbar-${pluginOptions.repositoryName}`
    })
  ]);
};

exports.onRenderBody = onRenderBody;
//# sourceMappingURL=gatsby-ssr.js.map
