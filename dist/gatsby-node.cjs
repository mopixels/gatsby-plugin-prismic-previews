'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const prismic = require('@prismicio/client');
const fs = require('fs');
const gatsbyPrismic = require('gatsby-source-prismic');
const path = require('path');
const gatsbyNodeHelpers = require('gatsby-node-helpers');
const md5 = require('tiny-hashes/md5');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

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

const prismic__namespace = /*#__PURE__*/_interopNamespace(prismic);
const gatsbyPrismic__namespace = /*#__PURE__*/_interopNamespace(gatsbyPrismic);
const path__namespace = /*#__PURE__*/_interopNamespace(path);
const md5__default = /*#__PURE__*/_interopDefaultLegacy(md5);

const DEFAULT_TOOLBAR = "new";
const DEFAULT_PROMPT_FOR_ACCESS_TOKEN = true;
const TYPE_PATHS_BASENAME_TEMPLATE = "type-paths-store %s";
const REPORTER_TEMPLATE = "gatsby-plugin-prismic-previews(%s) - %s";
const WROTE_TYPE_PATHS_TO_FS_MSG = "Wrote type paths store to %s";
const TYPE_PATHS_MISSING_NODE_MSG = `Type paths for this repository could not be found. Check that you have gatsby-source-prismic configured with the same repository name and type prefix (if used) in gatsby-config.js.`;

const pluginOptionsSchema = function(args) {
  const { Joi } = args;
  const schema = Joi.object({
    repositoryName: Joi.string().required(),
    accessToken: Joi.string(),
    promptForAccessToken: Joi.boolean().default(DEFAULT_PROMPT_FOR_ACCESS_TOKEN),
    apiEndpoint: Joi.string().default((parent) => prismic__namespace.getEndpoint(parent.repositoryName)),
    routes: Joi.array().items(Joi.object({
      type: Joi.string().required(),
      path: Joi.string().required(),
      resolvers: Joi.object().pattern(Joi.string(), Joi.string().required())
    })),
    graphQuery: Joi.string(),
    fetchLinks: Joi.array().items(Joi.string().required()),
    lang: Joi.string().default(gatsbyPrismic.DEFAULT_LANG),
    pageSize: Joi.number().default(100),
    imageImgixParams: Joi.object().default(gatsbyPrismic.DEFAULT_IMGIX_PARAMS),
    imagePlaceholderImgixParams: Joi.object().default(gatsbyPrismic.DEFAULT_PLACEHOLDER_IMGIX_PARAMS),
    typePrefix: Joi.string(),
    toolbar: Joi.string().valid("new", "legacy").default(DEFAULT_TOOLBAR),
    writeTypePathsToFilesystem: Joi.function().default(() => async (args2) => await fs.promises.writeFile(args2.publicPath, args2.serializedTypePaths))
  }).oxor("fetchLinks", "graphQuery");
  return schema;
};

const serializeTypePathNodes = (typePathNodes) => {
  return JSON.stringify(typePathNodes.map((node) => ({
    kind: node.kind,
    type: node.type,
    path: node.path
  })));
};

const sprintf = (string, ...args) => {
  let i = 0;
  return string.replace(/%s/g, () => args[i++]);
};

const onPostBootstrap = async (gatsbyContext, pluginOptions) => {
  const nodeHelpers = gatsbyNodeHelpers.createNodeHelpers({
    typePrefix: [gatsbyPrismic__namespace.GLOBAL_TYPE_PREFIX, pluginOptions.typePrefix].filter(Boolean).join(" "),
    fieldPrefix: gatsbyPrismic__namespace.GLOBAL_TYPE_PREFIX,
    createNodeId: gatsbyContext.createNodeId,
    createContentDigest: gatsbyContext.createContentDigest
  });
  const typePathNodes = gatsbyContext.getNodesByType(nodeHelpers.createTypeName("TypePathType"));
  if (typePathNodes.length < 1) {
    gatsbyContext.reporter.panic(sprintf(REPORTER_TEMPLATE, pluginOptions.repositoryName, TYPE_PATHS_MISSING_NODE_MSG));
  }
  const serializedTypePaths = serializeTypePathNodes(typePathNodes);
  const filename = `${md5__default["default"](sprintf(TYPE_PATHS_BASENAME_TEMPLATE, pluginOptions.repositoryName))}.json`;
  const publicPath = path__namespace.join("public", "static", filename);
  await pluginOptions.writeTypePathsToFilesystem({
    publicPath,
    serializedTypePaths
  });
  gatsbyContext.reporter.verbose(sprintf(REPORTER_TEMPLATE, pluginOptions.repositoryName, sprintf(WROTE_TYPE_PATHS_TO_FS_MSG, publicPath)));
};

exports.onPostBootstrap = onPostBootstrap;
exports.pluginOptionsSchema = pluginOptionsSchema;
//# sourceMappingURL=gatsby-node.cjs.map
