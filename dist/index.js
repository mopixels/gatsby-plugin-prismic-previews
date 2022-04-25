import * as React from 'react';
import * as gatsbyPrismic from 'gatsby-source-prismic';
import * as cookie from 'es-cookie';
import * as prismic from '@prismicio/client';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import * as gatsby from 'gatsby';
import md5 from 'tiny-hashes/md5';
import root from 'react-shadow';
import clsx from 'clsx';
import { DialogOverlay, DialogContent } from '@reach/dialog';
import * as cc from 'camel-case';

const isPlainObject = (value) => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

var version = "5.2.6";

const VERSION = version;
const IS_PROXY = Symbol("IS_PROXY");
const TYPE_PATHS_BASENAME_TEMPLATE = "type-paths-store %s";
const WINDOW_PLUGIN_OPTIONS_KEY = "__GATSBY_PLUGIN_PRISMIC_PREVIEWS_PLUGIN_OPTIONS__";
const WINDOW_PROVIDER_PRESENCE_KEY = "__GATSBY_PLUGIN_PRISMIC_PREVIEWS_PROVIDER_PRESENCE__";
const COOKIE_ACCESS_TOKEN_NAME = "gatsby-plugin-prismic-previews.%s.accessToken";
const MISSING_REPOSITORY_CONFIG_MSG = `A configuration object could not be found for repository "%s". Check that the repository is configured in your app's %s.`;
const MISSING_PLUGIN_OPTIONS_MSG = `Plugin options could not be found for repository "%s". Check that the repository is configured in your app's gatsby-config.js`;
const MISSING_PROVIDER_MSG = `A <PrismicPreviewProvider> was not found in your app. Add <PrismicPreviewProvider> to your app's gatsby-browser.js and gatsby-ssr.js wrapRootElement exports.

See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-browser/#wrapRootElement
See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-ssr/#wrapRootElement`;

const isProxy = (value) => {
  return Boolean(value[IS_PROXY]);
};

const sprintf = (string, ...args) => {
  let i = 0;
  return string.replace(/%s/g, () => args[i++]);
};

var PrismicPreviewState;
(function(PrismicPreviewState2) {
  PrismicPreviewState2["IDLE"] = "IDLE";
  PrismicPreviewState2["RESOLVING"] = "RESOLVING";
  PrismicPreviewState2["RESOLVED"] = "RESOLVED";
  PrismicPreviewState2["BOOTSTRAPPING"] = "BOOTSTRAPPING";
  PrismicPreviewState2["ACTIVE"] = "ACTIVE";
  PrismicPreviewState2["PROMPT_FOR_ACCESS_TOKEN"] = "PROMPT_FOR_ACCESS_TOKEN";
  PrismicPreviewState2["FAILED"] = "FAILED";
  PrismicPreviewState2["NOT_PREVIEW"] = "NOT_PREVIEW";
})(PrismicPreviewState || (PrismicPreviewState = {}));
var PrismicContextActionType;
(function(PrismicContextActionType2) {
  PrismicContextActionType2["SetActiveRepositoryName"] = "SetActiveRepositoryName";
  PrismicContextActionType2["SetAccessToken"] = "SetAccessToken";
  PrismicContextActionType2["SetupRuntime"] = "SetupRuntime";
  PrismicContextActionType2["RegisterDocuments"] = "RegisterDocuments";
  PrismicContextActionType2["ImportTypePaths"] = "ImportTypePaths";
  PrismicContextActionType2["StartResolving"] = "StartResolving";
  PrismicContextActionType2["Resolved"] = "Resolved";
  PrismicContextActionType2["StartBootstrapping"] = "StartBootstrapping";
  PrismicContextActionType2["Bootstrapped"] = "Bootstrapped";
  PrismicContextActionType2["Failed"] = "Failed";
  PrismicContextActionType2["NotAPreview"] = "NotAPreview";
  PrismicContextActionType2["PromptForAccessToken"] = "PromptForAccessToken";
  PrismicContextActionType2["GoToIdle"] = "GoToIdle";
})(PrismicContextActionType || (PrismicContextActionType = {}));
const contextReducer = (state, action) => {
  switch (action.type) {
    case PrismicContextActionType.SetActiveRepositoryName: {
      return {
        ...state,
        activeRepositoryName: action.payload.repositoryName
      };
    }
    case PrismicContextActionType.SetupRuntime: {
      const runtime = gatsbyPrismic.createRuntime({
        linkResolver: action.payload.repositoryConfig.linkResolver,
        htmlSerializer: action.payload.repositoryConfig.htmlSerializer,
        transformFieldName: action.payload.repositoryConfig.transformFieldName,
        typePrefix: action.payload.pluginOptions.typePrefix,
        imageImgixParams: action.payload.pluginOptions.imageImgixParams,
        imagePlaceholderImgixParams: action.payload.pluginOptions.imagePlaceholderImgixParams
      });
      return {
        ...state,
        runtimeStore: {
          ...state.runtimeStore,
          [action.payload.repositoryName]: runtime
        }
      };
    }
    case PrismicContextActionType.RegisterDocuments: {
      const runtime = state.runtimeStore[action.payload.repositoryName];
      if (runtime) {
        runtime.registerDocuments(action.payload.documents);
      } else {
        throw new Error(`A runtime for repository "${action.payload.repositoryName}" as not found`);
      }
      return state;
    }
    case PrismicContextActionType.ImportTypePaths: {
      const runtime = state.runtimeStore[action.payload.repositoryName];
      if (runtime) {
        runtime.importTypePaths(action.payload.typePathsExport);
      } else {
        throw new Error(`A runtime for repository "${action.payload.repositoryName}" as not found`);
      }
      return state;
    }
    case PrismicContextActionType.SetAccessToken: {
      const repositoryName = action.payload.repositoryName;
      return {
        ...state,
        pluginOptionsStore: {
          ...state.pluginOptionsStore,
          [repositoryName]: {
            ...state.pluginOptionsStore[repositoryName],
            accessToken: action.payload.accessToken
          }
        }
      };
    }
    case PrismicContextActionType.StartResolving: {
      return {
        ...state,
        previewState: PrismicPreviewState.RESOLVING
      };
    }
    case PrismicContextActionType.Resolved: {
      return {
        ...state,
        previewState: PrismicPreviewState.RESOLVED,
        resolvedPath: action.payload.path
      };
    }
    case PrismicContextActionType.StartBootstrapping: {
      return {
        ...state,
        previewState: PrismicPreviewState.BOOTSTRAPPING,
        isBootstrapped: false
      };
    }
    case PrismicContextActionType.Bootstrapped: {
      return {
        ...state,
        previewState: PrismicPreviewState.ACTIVE,
        isBootstrapped: true
      };
    }
    case PrismicContextActionType.Failed: {
      return {
        ...state,
        previewState: PrismicPreviewState.FAILED,
        error: action.payload.error
      };
    }
    case PrismicContextActionType.NotAPreview: {
      return {
        ...state,
        previewState: PrismicPreviewState.NOT_PREVIEW
      };
    }
    case PrismicContextActionType.PromptForAccessToken: {
      return {
        ...state,
        previewState: PrismicPreviewState.PROMPT_FOR_ACCESS_TOKEN
      };
    }
    case PrismicContextActionType.GoToIdle: {
      return {
        ...state,
        previewState: PrismicPreviewState.IDLE
      };
    }
  }
};
const defaultInitialState = {
  activeRepositoryName: void 0,
  previewState: PrismicPreviewState.IDLE,
  isBootstrapped: false,
  runtimeStore: {},
  pluginOptionsStore: {},
  repositoryConfigs: []
};
const createInitialState = (repositoryConfigs = defaultInitialState.repositoryConfigs) => {
  const pluginOptionsStore = typeof window === "undefined" ? {} : window[WINDOW_PLUGIN_OPTIONS_KEY] || {};
  const repositoryNames = Object.keys(pluginOptionsStore);
  const injectedPluginOptionsStore = repositoryNames.reduce((acc, repositoryName) => {
    const persistedAccessTokenCookieName = sprintf(COOKIE_ACCESS_TOKEN_NAME, repositoryName);
    const persistedAccessToken = cookie.get(persistedAccessTokenCookieName);
    acc[repositoryName] = pluginOptionsStore[repositoryName];
    if (acc[repositoryName].accessToken == null && persistedAccessToken) {
      acc[repositoryName].accessToken = persistedAccessToken;
    }
    return acc;
  }, {});
  return {
    ...defaultInitialState,
    pluginOptionsStore: injectedPluginOptionsStore,
    repositoryConfigs
  };
};
const defaultContextValue = [
  defaultInitialState,
  () => void 0
];
const PrismicContext = React.createContext(defaultContextValue);
const PrismicPreviewProvider = ({
  repositoryConfigs,
  children
}) => {
  const initialState = createInitialState(repositoryConfigs);
  const reducerTuple = React.useReducer(contextReducer, initialState);
  if (typeof window !== "undefined") {
    window[WINDOW_PROVIDER_PRESENCE_KEY] = true;
  }
  return /* @__PURE__ */ React.createElement(PrismicContext.Provider, {
    value: reducerTuple
  }, children);
};

const usePrismicPreviewContext = () => {
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development" && !window[WINDOW_PROVIDER_PRESENCE_KEY]) {
      console.warn(MISSING_PROVIDER_MSG);
    }
  }, []);
  return React.useContext(PrismicContext);
};

const findAndReplacePreviewables = (runtime, nodeOrLeaf) => {
  if (isPlainObject(nodeOrLeaf)) {
    if (isProxy(nodeOrLeaf)) {
      return nodeOrLeaf;
    }
    const nodeId = nodeOrLeaf[gatsbyPrismic.PREVIEWABLE_NODE_ID_FIELD];
    if (nodeId && runtime.hasNode(nodeId)) {
      return runtime.getNode(nodeId);
    }
    const newNode = {};
    for (const key in nodeOrLeaf) {
      newNode[key] = findAndReplacePreviewables(runtime, nodeOrLeaf[key]);
    }
    return newNode;
  }
  if (Array.isArray(nodeOrLeaf)) {
    return nodeOrLeaf.map((subnode) => findAndReplacePreviewables(runtime, subnode));
  }
  return nodeOrLeaf;
};
const traverseAndReplace = (staticData, runtime) => {
  if (runtime.nodes.length > 0) {
    return {
      data: findAndReplacePreviewables(runtime, staticData),
      isPreview: true
    };
  } else {
    return {
      data: staticData,
      isPreview: false
    };
  }
};
const useMergePrismicPreviewData = (staticData, config = { skip: false }) => {
  const [state] = usePrismicPreviewContext();
  return React.useMemo(() => {
    const runtime = state.activeRepositoryName ? state.runtimeStore[state.activeRepositoryName] : void 0;
    if (!config.skip && runtime && state.previewState === PrismicPreviewState.ACTIVE) {
      return traverseAndReplace(staticData, runtime);
    } else {
      return { data: staticData, isPreview: false };
    }
  }, [staticData, config.skip, state]);
};

const usePrismicPreviewAccessToken = (repositoryName) => {
  const [contextState, contextDispatch] = usePrismicPreviewContext();
  const cookieName = repositoryName ? sprintf(COOKIE_ACCESS_TOKEN_NAME, repositoryName) : void 0;
  const setAccessToken = React.useCallback((accessToken, remember = true) => {
    if (!repositoryName || !cookieName) {
      throw new Error("A repository name must be provided to usePrismicPreviewAccessToken before using the set function.");
    }
    contextDispatch({
      type: PrismicContextActionType.SetAccessToken,
      payload: { repositoryName, accessToken }
    });
    if (remember) {
      cookie.set(cookieName, accessToken);
    }
  }, [cookieName, contextDispatch, repositoryName]);
  const removeAccessTokenCookie = React.useCallback(() => {
    if (!cookieName) {
      throw new Error("A repository name must be provided to usePrismicPreviewAccessToken before using the removeCookie function.");
    }
    cookie.remove(cookieName);
  }, [cookieName]);
  return React.useMemo(() => {
    var _a;
    return [
      repositoryName ? (_a = contextState.pluginOptionsStore[repositoryName]) == null ? void 0 : _a.accessToken : void 0,
      {
        set: setAccessToken,
        removeCookie: removeAccessTokenCookie
      }
    ];
  }, [
    repositoryName,
    contextState.pluginOptionsStore,
    setAccessToken,
    removeAccessTokenCookie
  ]);
};

const extractFirstSubdomain = (host) => O.fromNullable(host.split(".")[0]);
const parseObjectRef = (previewRef) => {
  try {
    const parsed = JSON.parse(previewRef);
    const keys = Object.keys(parsed);
    const domainKey = keys.find((key) => /\.prismic\.io$/.test(key));
    return domainKey ? extractFirstSubdomain(domainKey) : O.none;
  } catch (e) {
    return O.none;
  }
};
const parseURLRef = (previewRef) => {
  try {
    const url = new URL(previewRef);
    return extractFirstSubdomain(url.host);
  } catch (e) {
    return O.none;
  }
};
const extractPreviewRefRepositoryName = (previewRef) => {
  const fromObjectRef = parseObjectRef(previewRef);
  if (O.isSome(fromObjectRef)) {
    return fromObjectRef;
  } else {
    return parseURLRef(previewRef);
  }
};

const buildTypePathsStoreFilename = (repositoryName) => {
  return `${md5(sprintf(TYPE_PATHS_BASENAME_TEMPLATE, repositoryName))}.json`;
};

const fetchTypePaths = async (config) => {
  const filename = buildTypePathsStoreFilename(config.repositoryName);
  const url = gatsby.withAssetPrefix(`/static/${filename}`);
  const fetchFn = config.fetch || globalThis.fetch;
  try {
    const res = await fetchFn(url, {
      cache: "no-cache"
    });
    const text = await res.text();
    return E.right(text);
  } catch (error) {
    return E.left(error);
  }
};

const usePrismicPreviewBootstrap = (repositoryConfigs = [], config = {}) => {
  const [contextState, contextDispatch] = usePrismicPreviewContext();
  const contextStateRef = React.useRef(contextState);
  React.useEffect(() => {
    contextStateRef.current = contextState;
  }, [contextState]);
  return React.useCallback(async () => {
    var _a;
    if (contextStateRef.current.previewState !== PrismicPreviewState.IDLE && contextStateRef.current.previewState !== PrismicPreviewState.RESOLVED || contextStateRef.current.isBootstrapped) {
      return;
    }
    const previewRef = cookie.get(prismic.cookie.preview);
    const repositoryName = previewRef ? extractPreviewRefRepositoryName(previewRef) : O.none;
    if (O.isNone(repositoryName)) {
      return contextDispatch({
        type: PrismicContextActionType.NotAPreview
      });
    }
    contextDispatch({
      type: PrismicContextActionType.SetActiveRepositoryName,
      payload: { repositoryName: repositoryName.value }
    });
    const resolvedRepositoryConfigs = [
      ...repositoryConfigs,
      ...contextState.repositoryConfigs
    ];
    const repositoryConfig = resolvedRepositoryConfigs.find((config2) => config2.repositoryName === repositoryName.value);
    if (!repositoryConfig) {
      return contextDispatch({
        type: PrismicContextActionType.Failed,
        payload: {
          error: new Error(sprintf(MISSING_REPOSITORY_CONFIG_MSG, repositoryName.value, "withPrismicPreview and withPrismicUnpublishedPreview"))
        }
      });
    }
    const repositoryPluginOptions = contextState.pluginOptionsStore[repositoryName.value];
    if (!repositoryPluginOptions) {
      return contextDispatch({
        type: PrismicContextActionType.Failed,
        payload: {
          error: new Error(sprintf(MISSING_PLUGIN_OPTIONS_MSG, repositoryName.value))
        }
      });
    }
    contextDispatch({
      type: PrismicContextActionType.SetupRuntime,
      payload: {
        repositoryName: repositoryName.value,
        repositoryConfig,
        pluginOptions: repositoryPluginOptions
      }
    });
    contextDispatch({
      type: PrismicContextActionType.StartBootstrapping
    });
    const typePaths = await fetchTypePaths({
      repositoryName: repositoryName.value,
      fetch: config.fetch
    });
    if (E.isLeft(typePaths)) {
      return contextDispatch({
        type: PrismicContextActionType.Failed,
        payload: { error: typePaths.left }
      });
    }
    contextDispatch({
      type: PrismicContextActionType.ImportTypePaths,
      payload: {
        repositoryName: repositoryName.value,
        typePathsExport: typePaths.right
      }
    });
    const endpoint = (_a = repositoryPluginOptions.apiEndpoint) != null ? _a : prismic.getEndpoint(repositoryName.value);
    const client = prismic.createClient(endpoint, {
      accessToken: repositoryPluginOptions.accessToken,
      routes: repositoryPluginOptions.routes,
      defaultParams: {
        lang: repositoryPluginOptions.lang,
        fetchLinks: repositoryPluginOptions.fetchLinks,
        graphQuery: repositoryPluginOptions.graphQuery,
        pageSize: repositoryPluginOptions.pageSize
      },
      fetch: config.fetch
    });
    client.enableAutoPreviews();
    let allDocuments;
    try {
      allDocuments = await client.dangerouslyGetAll();
    } catch (error) {
      if (error instanceof prismic.ForbiddenError && repositoryPluginOptions.promptForAccessToken) {
        return contextDispatch({
          type: PrismicContextActionType.PromptForAccessToken
        });
      } else {
        return contextDispatch({
          type: PrismicContextActionType.Failed,
          payload: { error }
        });
      }
    }
    contextDispatch({
      type: PrismicContextActionType.RegisterDocuments,
      payload: {
        repositoryName: repositoryName.value,
        documents: allDocuments
      }
    });
    contextDispatch({
      type: PrismicContextActionType.Bootstrapped
    });
  }, [
    repositoryConfigs,
    contextState.repositoryConfigs,
    contextState.pluginOptionsStore,
    contextDispatch,
    config.fetch
  ]);
};

const getURLSearchParam = (key) => {
  const params = new URLSearchParams(window.location.search);
  return O.fromNullable(params.get(key));
};

const usePrismicPreviewResolver = (repositoryConfigs = [], config = {}) => {
  const [contextState, contextDispatch] = usePrismicPreviewContext();
  const contextStateRef = React.useRef(contextState);
  React.useEffect(() => {
    contextStateRef.current = contextState;
  }, [contextState]);
  return React.useCallback(async () => {
    var _a;
    if (contextStateRef.current.previewState !== PrismicPreviewState.IDLE) {
      return;
    }
    const previewRef = cookie.get(prismic.cookie.preview);
    const documentId = getURLSearchParam("documentId");
    const repositoryName = previewRef ? extractPreviewRefRepositoryName(previewRef) : O.none;
    if (O.isNone(documentId) || O.isNone(repositoryName)) {
      return contextDispatch({
        type: PrismicContextActionType.NotAPreview
      });
    }
    contextDispatch({
      type: PrismicContextActionType.SetActiveRepositoryName,
      payload: { repositoryName: repositoryName.value }
    });
    const resolvedRepositoryConfigs = [
      ...repositoryConfigs,
      ...contextState.repositoryConfigs
    ];
    const repositoryConfig = resolvedRepositoryConfigs.find((config2) => config2.repositoryName === repositoryName.value);
    if (!repositoryConfig) {
      return contextDispatch({
        type: PrismicContextActionType.Failed,
        payload: {
          error: new Error(sprintf(MISSING_REPOSITORY_CONFIG_MSG, repositoryName.value, "withPrismicPreview and withPrismicUnpublishedPreview"))
        }
      });
    }
    const repositoryPluginOptions = contextState.pluginOptionsStore[repositoryName.value];
    if (!repositoryPluginOptions) {
      return contextDispatch({
        type: PrismicContextActionType.Failed,
        payload: {
          error: new Error(sprintf(MISSING_PLUGIN_OPTIONS_MSG, repositoryName.value))
        }
      });
    }
    contextDispatch({
      type: PrismicContextActionType.StartResolving
    });
    const endpoint = (_a = repositoryPluginOptions.apiEndpoint) != null ? _a : prismic.getEndpoint(repositoryName.value);
    const client = prismic.createClient(endpoint, {
      accessToken: repositoryPluginOptions.accessToken,
      routes: repositoryPluginOptions.routes,
      defaultParams: {
        lang: repositoryPluginOptions.lang,
        fetchLinks: repositoryPluginOptions.fetchLinks,
        graphQuery: repositoryPluginOptions.graphQuery
      },
      fetch: config.fetch
    });
    client.enableAutoPreviews();
    let path;
    try {
      path = await client.resolvePreviewURL({
        linkResolver: repositoryConfig.linkResolver,
        defaultURL: "/"
      });
    } catch (error) {
      if (error instanceof prismic.ForbiddenError && repositoryPluginOptions.promptForAccessToken) {
        return contextDispatch({
          type: PrismicContextActionType.PromptForAccessToken
        });
      } else {
        return contextDispatch({
          type: PrismicContextActionType.Failed,
          payload: { error }
        });
      }
    }
    contextDispatch({
      type: PrismicContextActionType.Resolved,
      payload: { path }
    });
  }, [
    contextDispatch,
    contextState.pluginOptionsStore,
    contextState.repositoryConfigs,
    repositoryConfigs,
    config.fetch
  ]);
};

const getComponentDisplayName = (WrappedComponent) => WrappedComponent.displayName || WrappedComponent.name || "Component";

const userFriendlyError = (error) => {
  if (error instanceof prismic.ForbiddenError) {
    return new Error("Unauthorized access");
  } else {
    return error;
  }
};

var css_248z = "@import url(\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap\");\n\n/*! tailwindcss v2.2.19 | MIT License | https://tailwindcss.com */\n\n/*! modern-normalize v1.1.0 | MIT License | https://github.com/sindresorhus/modern-normalize */\n\n/*\nDocument\n========\n*/\n\n/**\nUse a better box model (opinionated).\n*/\n\n*,\n::before,\n::after {\n\tbox-sizing: border-box;\n}\n\n/**\nUse a more readable tab size (opinionated).\n*/\n\nhtml {\n\t-moz-tab-size: 4;\n\ttab-size: 4;\n}\n\n/**\n1. Correct the line height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n*/\n\nhtml {\n\tline-height: 1.15; /* 1 */\n\t-webkit-text-size-adjust: 100%; /* 2 */\n}\n\n/*\nSections\n========\n*/\n\n/**\nRemove the margin in all browsers.\n*/\n\nbody {\n\tmargin: 0;\n}\n\n/**\nImprove consistency of default fonts in all browsers. (https://github.com/sindresorhus/modern-normalize/issues/3)\n*/\n\nbody {\n\tfont-family:\n\t\tsystem-ui,\n\t\t-apple-system, /* Firefox supports this but not yet `system-ui` */\n\t\t'Segoe UI',\n\t\tRoboto,\n\t\tHelvetica,\n\t\tArial,\n\t\tsans-serif,\n\t\t'Apple Color Emoji',\n\t\t'Segoe UI Emoji';\n}\n\n/*\nGrouping content\n================\n*/\n\n/**\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n*/\n\nhr {\n\theight: 0; /* 1 */\n\tcolor: inherit; /* 2 */\n}\n\n/*\nText-level semantics\n====================\n*/\n\n/**\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\n\nabbr[title] {\n\ttext-decoration: underline dotted;\n}\n\n/**\nAdd the correct font weight in Edge and Safari.\n*/\n\nb,\nstrong {\n\tfont-weight: bolder;\n}\n\n/**\n1. Improve consistency of default fonts in all browsers. (https://github.com/sindresorhus/modern-normalize/issues/3)\n2. Correct the odd 'em' font sizing in all browsers.\n*/\n\ncode,\nkbd,\nsamp,\npre {\n\tfont-family:\n\t\tui-monospace,\n\t\tSFMono-Regular,\n\t\tConsolas,\n\t\t'Liberation Mono',\n\t\tMenlo,\n\t\tmonospace; /* 1 */\n\tfont-size: 1em; /* 2 */\n}\n\n/**\nAdd the correct font size in all browsers.\n*/\n\nsmall {\n\tfont-size: 80%;\n}\n\n/**\nPrevent 'sub' and 'sup' elements from affecting the line height in all browsers.\n*/\n\nsub,\nsup {\n\tfont-size: 75%;\n\tline-height: 0;\n\tposition: relative;\n\tvertical-align: baseline;\n}\n\nsub {\n\tbottom: -0.25em;\n}\n\nsup {\n\ttop: -0.5em;\n}\n\n/*\nTabular data\n============\n*/\n\n/**\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n*/\n\ntable {\n\ttext-indent: 0; /* 1 */\n\tborder-color: inherit; /* 2 */\n}\n\n/*\nForms\n=====\n*/\n\n/**\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n*/\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n\tfont-family: inherit; /* 1 */\n\tfont-size: 100%; /* 1 */\n\tline-height: 1.15; /* 1 */\n\tmargin: 0; /* 2 */\n}\n\n/**\nRemove the inheritance of text transform in Edge and Firefox.\n1. Remove the inheritance of text transform in Firefox.\n*/\n\nbutton,\nselect { /* 1 */\n\ttext-transform: none;\n}\n\n/**\nCorrect the inability to style clickable types in iOS and Safari.\n*/\n\nbutton,\n[type='button'],\n[type='reset'],\n[type='submit'] {\n\t-webkit-appearance: button;\n}\n\n/**\nRemove the inner border and padding in Firefox.\n*/\n\n::-moz-focus-inner {\n\tborder-style: none;\n\tpadding: 0;\n}\n\n/**\nRestore the focus styles unset by the previous rule.\n*/\n\n:-moz-focusring {\n\toutline: 1px dotted ButtonText;\n}\n\n/**\nRemove the additional ':invalid' styles in Firefox.\nSee: https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737\n*/\n\n:-moz-ui-invalid {\n\tbox-shadow: none;\n}\n\n/**\nRemove the padding so developers are not caught out when they zero out 'fieldset' elements in all browsers.\n*/\n\nlegend {\n\tpadding: 0;\n}\n\n/**\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\n\nprogress {\n\tvertical-align: baseline;\n}\n\n/**\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\n\n::-webkit-inner-spin-button,\n::-webkit-outer-spin-button {\n\theight: auto;\n}\n\n/**\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\n\n[type='search'] {\n\t-webkit-appearance: textfield; /* 1 */\n\toutline-offset: -2px; /* 2 */\n}\n\n/**\nRemove the inner padding in Chrome and Safari on macOS.\n*/\n\n::-webkit-search-decoration {\n\t-webkit-appearance: none;\n}\n\n/**\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to 'inherit' in Safari.\n*/\n\n::-webkit-file-upload-button {\n\t-webkit-appearance: button; /* 1 */\n\tfont: inherit; /* 2 */\n}\n\n/*\nInteractive\n===========\n*/\n\n/*\nAdd the correct display in Chrome and Safari.\n*/\n\nsummary {\n\tdisplay: list-item;\n}\n\n/**\n * Manually forked from SUIT CSS Base: https://github.com/suitcss/base\n * A thin layer on top of normalize.css that provides a starting point more\n * suitable for web applications.\n */\n\n/**\n * Removes the default spacing and border for appropriate elements.\n */\n\nblockquote,\ndl,\ndd,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nhr,\nfigure,\np,\npre {\n  margin: 0;\n}\n\nbutton {\n  background-color: transparent;\n  background-image: none;\n}\n\nfieldset {\n  margin: 0;\n  padding: 0;\n}\n\nol,\nul {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n/**\n * Tailwind custom reset styles\n */\n\n/**\n * 1. Use the user's configured `sans` font-family (with Tailwind's default\n *    sans-serif font stack as a fallback) as a sane default.\n * 2. Use Tailwind's default \"normal\" line-height so the user isn't forced\n *    to override it to ensure consistency even when using the default theme.\n */\n\nhtml {\n  font-family: Inter, sans-serif; /* 1 */\n  line-height: 1.5; /* 2 */\n}\n\n/**\n * Inherit font-family and line-height from `html` so users can set them as\n * a class directly on the `html` element.\n */\n\nbody {\n  font-family: inherit;\n  line-height: inherit;\n}\n\n/**\n * 1. Prevent padding and border from affecting element width.\n *\n *    We used to set this in the html element and inherit from\n *    the parent element for everything else. This caused issues\n *    in shadow-dom-enhanced elements like <details> where the content\n *    is wrapped by a div with box-sizing set to `content-box`.\n *\n *    https://github.com/mozdevs/cssremedy/issues/4\n *\n *\n * 2. Allow adding a border to an element by just adding a border-width.\n *\n *    By default, the way the browser specifies that an element should have no\n *    border is by setting it's border-style to `none` in the user-agent\n *    stylesheet.\n *\n *    In order to easily add borders to elements by just setting the `border-width`\n *    property, we change the default border-style for all elements to `solid`, and\n *    use border-width to hide them instead. This way our `border` utilities only\n *    need to set the `border-width` property instead of the entire `border`\n *    shorthand, making our border utilities much more straightforward to compose.\n *\n *    https://github.com/tailwindcss/tailwindcss/pull/116\n */\n\n*,\n::before,\n::after {\n  box-sizing: border-box; /* 1 */\n  border-width: 0; /* 2 */\n  border-style: solid; /* 2 */\n  border-color: currentColor; /* 2 */\n}\n\n/*\n * Ensure horizontal rules are visible by default\n */\n\nhr {\n  border-top-width: 1px;\n}\n\n/**\n * Undo the `border-style: none` reset that Normalize applies to images so that\n * our `border-{width}` utilities have the expected effect.\n *\n * The Normalize reset is unnecessary for us since we default the border-width\n * to 0 on all elements.\n *\n * https://github.com/tailwindcss/tailwindcss/issues/362\n */\n\nimg {\n  border-style: solid;\n}\n\ntextarea {\n  resize: vertical;\n}\n\ninput::placeholder,\ntextarea::placeholder {\n  opacity: 1;\n  color: #a1a1aa;\n}\n\nbutton,\n[role=\"button\"] {\n  cursor: pointer;\n}\n\n/**\n * Override legacy focus reset from Normalize with modern Firefox focus styles.\n *\n * This is actually an improvement over the new defaults in Firefox in our testing,\n * as it triggers the better focus styles even for links, which still use a dotted\n * outline in Firefox by default.\n */\n\n:-moz-focusring {\n\toutline: auto;\n}\n\ntable {\n  border-collapse: collapse;\n}\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: inherit;\n  font-weight: inherit;\n}\n\n/**\n * Reset links to optimize for opt-in styling instead of\n * opt-out.\n */\n\na {\n  color: inherit;\n  text-decoration: inherit;\n}\n\n/**\n * Reset form element properties that are easy to forget to\n * style explicitly so you don't inadvertently introduce\n * styles that deviate from your design system. These styles\n * supplement a partial reset that is already applied by\n * normalize.css.\n */\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  padding: 0;\n  line-height: inherit;\n  color: inherit;\n}\n\n/**\n * Use the configured 'mono' font family for elements that\n * are expected to be rendered with a monospace font, falling\n * back to the system monospace stack if there is no configured\n * 'mono' font family.\n */\n\npre,\ncode,\nkbd,\nsamp {\n  font-family: JetBrains Mono, monospace;\n}\n\n/**\n * 1. Make replaced elements `display: block` by default as that's\n *    the behavior you want almost all of the time. Inspired by\n *    CSS Remedy, with `svg` added as well.\n *\n *    https://github.com/mozdevs/cssremedy/issues/14\n * \n * 2. Add `vertical-align: middle` to align replaced elements more\n *    sensibly by default when overriding `display` by adding a\n *    utility like `inline`.\n *\n *    This can trigger a poorly considered linting error in some\n *    tools but is included by design.\n * \n *    https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210\n */\n\nimg,\nsvg,\nvideo,\ncanvas,\naudio,\niframe,\nembed,\nobject {\n  display: block; /* 1 */\n  vertical-align: middle; /* 2 */\n}\n\n/**\n * Constrain images and videos to the parent width and preserve\n * their intrinsic aspect ratio.\n *\n * https://github.com/mozdevs/cssremedy/issues/14\n */\n\nimg,\nvideo {\n  max-width: 100%;\n  height: auto;\n}\n\n/**\n * Ensure the default browser behavior of the `hidden` attribute.\n */\n\n[hidden] {\n  display: none;\n}\n\n*, ::before, ::after{\n\t--tw-translate-x: 0;\n\t--tw-translate-y: 0;\n\t--tw-rotate: 0;\n\t--tw-skew-x: 0;\n\t--tw-skew-y: 0;\n\t--tw-scale-x: 1;\n\t--tw-scale-y: 1;\n\t--tw-transform: translateX(var(--tw-translate-x)) translateY(var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n\tborder-color: currentColor;\n\t--tw-ring-offset-shadow: 0 0 #0000;\n\t--tw-ring-shadow: 0 0 #0000;\n\t--tw-shadow: 0 0 #0000;\n\t--tw-blur: var(--tw-empty,/*!*/ /*!*/);\n\t--tw-brightness: var(--tw-empty,/*!*/ /*!*/);\n\t--tw-contrast: var(--tw-empty,/*!*/ /*!*/);\n\t--tw-grayscale: var(--tw-empty,/*!*/ /*!*/);\n\t--tw-hue-rotate: var(--tw-empty,/*!*/ /*!*/);\n\t--tw-invert: var(--tw-empty,/*!*/ /*!*/);\n\t--tw-saturate: var(--tw-empty,/*!*/ /*!*/);\n\t--tw-sepia: var(--tw-empty,/*!*/ /*!*/);\n\t--tw-drop-shadow: var(--tw-empty,/*!*/ /*!*/);\n\t--tw-filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);\n}\n\nhtml{\n\tfont-size: 16px;\n\t--root-font-size-px: 16;\n\tline-height: 1.5;\n\t--line-height-unitless: 1.5;\n\t--line-gap-unitless: 0.5;\n}\n\n@media (min-width: 640px){\n\n\thtml{}\n}\n\n@media (min-width: 768px){\n\n\thtml{}\n}\n\n@media (min-width: 1024px){\n\n\thtml{}\n}\n\n@media (min-width: 1280px){\n\n\thtml{}\n}\n\n@media (min-width: 1536px){\n\n\thtml{}\n}\n\n.sr-only{\n\tposition: absolute;\n\twidth: 1px;\n\theight: 1px;\n\tpadding: 0;\n\tmargin: -1px;\n\toverflow: hidden;\n\tclip: rect(0, 0, 0, 0);\n\twhite-space: nowrap;\n\tborder-width: 0;\n}\n\n.pointer-events-none{\n\tpointer-events: none;\n}\n\n.pointer-events-auto{\n\tpointer-events: auto;\n}\n\n.static{\n\tposition: static;\n}\n\n.fixed{\n\tposition: fixed;\n}\n\n.absolute{\n\tposition: absolute;\n}\n\n.relative{\n\tposition: relative;\n}\n\n.inset-0{\n\ttop: 0px;\n\tright: 0px;\n\tbottom: 0px;\n\tleft: 0px;\n}\n\n.top-5{\n\ttop: 1.25rem;\n}\n\n.right-5{\n\tright: 1.25rem;\n}\n\n.z-max{\n\tz-index: 2147483647;\n}\n\n.-m-2{\n\tmargin: -0.5rem;\n}\n\n.mx-auto{\n\tmargin-left: auto;\n\tmargin-right: auto;\n}\n\n.my-2{\n\tmargin-top: 0.5rem;\n\tmargin-bottom: 0.5rem;\n}\n\n.mt-20vh{\n\tmargin-top: 20vh;\n}\n\n.-ml-4{\n\tmargin-left: -1rem;\n}\n\n.-mt-4{\n\tmargin-top: -1rem;\n}\n\n.-mt-5{\n\tmargin-top: -1.25rem;\n}\n\n.-ml-5{\n\tmargin-left: -1.25rem;\n}\n\n.block{\n\tdisplay: block;\n}\n\n.flex{\n\tdisplay: flex;\n}\n\n.grid{\n\tdisplay: grid;\n}\n\n.h-11{\n\theight: 2.75rem;\n}\n\n.h-5{\n\theight: 1.25rem;\n}\n\n.w-full{\n\twidth: 100%;\n}\n\n.w-11{\n\twidth: 2.75rem;\n}\n\n.w-5{\n\twidth: 1.25rem;\n}\n\n.min-w-7\\.5rem{\n\tmin-width: 7.5rem;\n}\n\n.max-w-34rem{\n\tmax-width: 34rem;\n}\n\n.transform{\n\ttransform: var(--tw-transform);\n}\n\n.grid-flow-col{\n\tgrid-auto-flow: column;\n}\n\n.flex-wrap{\n\tflex-wrap: wrap;\n}\n\n.justify-center{\n\tjustify-content: center;\n}\n\n.justify-items-center{\n\tjustify-items: center;\n}\n\n.gap-7{\n\tgap: 1.75rem;\n}\n\n.gap-6{\n\tgap: 1.5rem;\n}\n\n.gap-5{\n\tgap: 1.25rem;\n}\n\n.gap-3{\n\tgap: 0.75rem;\n}\n\n.gap-4{\n\tgap: 1rem;\n}\n\n.gap-2{\n\tgap: 0.5rem;\n}\n\n.overflow-auto{\n\toverflow: auto;\n}\n\n.rounded{\n\tborder-radius: 0.25rem;\n}\n\n.rounded-lg{\n\tborder-radius: 0.5rem;\n}\n\n.border{\n\tborder-width: 1px;\n}\n\n.border-purple-50{\n\t--tw-border-opacity: 1;\n\tborder-color: rgba(93, 106, 204, var(--tw-border-opacity));\n}\n\n.border-slate-90{\n\t--tw-border-opacity: 1;\n\tborder-color: rgba(224, 226, 238, var(--tw-border-opacity));\n}\n\n.border-white{\n\t--tw-border-opacity: 1;\n\tborder-color: rgba(255, 255, 255, var(--tw-border-opacity));\n}\n\n.border-red-40{\n\t--tw-border-opacity: 1;\n\tborder-color: rgba(196, 19, 62, var(--tw-border-opacity));\n}\n\n.border-debug{\n\t--tw-border-opacity: 1;\n\tborder-color: rgba(255, 0, 255, var(--tw-border-opacity));\n}\n\n.bg-red-40{\n\t--tw-bg-opacity: 1;\n\tbackground-color: rgba(196, 19, 62, var(--tw-bg-opacity));\n}\n\n.bg-purple-50{\n\t--tw-bg-opacity: 1;\n\tbackground-color: rgba(93, 106, 204, var(--tw-bg-opacity));\n}\n\n.bg-white{\n\t--tw-bg-opacity: 1;\n\tbackground-color: rgba(255, 255, 255, var(--tw-bg-opacity));\n}\n\n.bg-transparent{\n\tbackground-color: transparent;\n}\n\n.bg-black{\n\t--tw-bg-opacity: 1;\n\tbackground-color: rgba(0, 0, 0, var(--tw-bg-opacity));\n}\n\n.bg-slate-95{\n\t--tw-bg-opacity: 1;\n\tbackground-color: rgba(245, 246, 249, var(--tw-bg-opacity));\n}\n\n.bg-red-95{\n\t--tw-bg-opacity: 1;\n\tbackground-color: rgba(255, 239, 239, var(--tw-bg-opacity));\n}\n\n.bg-opacity-60{\n\t--tw-bg-opacity: 0.6;\n}\n\n.p-6{\n\tpadding: 1.5rem;\n}\n\n.p-2{\n\tpadding: 0.5rem;\n}\n\n.py-4{\n\tpadding-top: 1rem;\n\tpadding-bottom: 1rem;\n}\n\n.px-5{\n\tpadding-left: 1.25rem;\n\tpadding-right: 1.25rem;\n}\n\n.px-4{\n\tpadding-left: 1rem;\n\tpadding-right: 1rem;\n}\n\n.px-7{\n\tpadding-left: 1.75rem;\n\tpadding-right: 1.75rem;\n}\n\n.py-8{\n\tpadding-top: 2rem;\n\tpadding-bottom: 2rem;\n}\n\n.py-3{\n\tpadding-top: 0.75rem;\n\tpadding-bottom: 0.75rem;\n}\n\n.pl-4{\n\tpadding-left: 1rem;\n}\n\n.pt-4{\n\tpadding-top: 1rem;\n}\n\n.pl-5{\n\tpadding-left: 1.25rem;\n}\n\n.pt-5{\n\tpadding-top: 1.25rem;\n}\n\n.text-center{\n\ttext-align: center;\n}\n\n.font-semibold{\n\tfont-weight: 600;\n}\n\n.font-medium{\n\tfont-weight: 500;\n}\n\n.tracking-tight{\n\tletter-spacing: -0.025em;\n}\n\n.text-white{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(255, 255, 255, var(--tw-text-opacity));\n}\n\n.text-slate-60{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(136, 140, 165, var(--tw-text-opacity));\n}\n\n.text-slate-30{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(74, 86, 105, var(--tw-text-opacity));\n}\n\n.text-slate-90{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(224, 226, 238, var(--tw-text-opacity));\n}\n\n.text-red-80{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(255, 180, 180, var(--tw-text-opacity));\n}\n\n.text-slate-10{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(33, 39, 53, var(--tw-text-opacity));\n}\n\n.text-red-40{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(196, 19, 62, var(--tw-text-opacity));\n}\n\n.text-purple-50{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(93, 106, 204, var(--tw-text-opacity));\n}\n\n.placeholder-slate-70::placeholder{\n\t--tw-placeholder-opacity: 1;\n\tcolor: rgba(188, 190, 205, var(--tw-placeholder-opacity));\n}\n\n.placeholder-red-80::placeholder{\n\t--tw-placeholder-opacity: 1;\n\tcolor: rgba(255, 180, 180, var(--tw-placeholder-opacity));\n}\n\n.shadow-lg{\n\t--tw-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);\n\tbox-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n}\n\n.filter{\n\tfilter: var(--tw-filter);\n}\n\n.transition{\n\ttransition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n\ttransition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n\ttransition-duration: 150ms;\n}\n\n.font-sans{\n\tfont-family: Inter, sans-serif;\n\t--cap-height: 2048;\n\t--ascent: 2728;\n\t--descent: -680;\n\t--line-gap: 0;\n\t--units-per-em: 2816;\n\t--absolute-descent: 680;\n\t--cap-height-scale: 0.7272727272727273;\n\t--descent-scale: 0.24147727272727273;\n\t--ascent-scale: 0.96875;\n\t--line-gap-scale: 0;\n\t--line-height-scale: 1.2102272727272727;\n}\n\n.font-mono{\n\tfont-family: JetBrains Mono, monospace;\n\t--cap-height: 730;\n\t--ascent: 1020;\n\t--descent: -300;\n\t--line-gap: 0;\n\t--units-per-em: 1000;\n\t--absolute-descent: 300;\n\t--cap-height-scale: 0.73;\n\t--descent-scale: 0.3;\n\t--ascent-scale: 1.02;\n\t--line-gap-scale: 0;\n\t--line-height-scale: 1.32;\n}\n\n.text-12{\n\tfont-size: 12px;\n\t--font-size-px: 12;\n\t--line-height-px: calc(var(--line-height-unitless) * var(--font-size-px));\n}\n\n.text-12::before{\n\tcontent: \"\";\n\tdisplay: table;\n\t--line-height-normal: calc(var(--line-height-scale) * var(--font-size-px));\n\t--specified-line-height-offset-double: calc(var(--line-height-normal) - var(--line-height-px));\n\t--specified-line-height-offset: calc(var(--specified-line-height-offset-double) / 2 );\n\t--specified-line-height-offset-to-scale: calc(var(--specified-line-height-offset) / var(--font-size-px));\n\t--line-gap-scale-half: calc(var(--line-gap-scale) / 2);\n\t--leading-trim-top: calc( var(--ascent-scale) - var(--cap-height-scale) + var(--line-gap-scale-half) - var(--specified-line-height-offset-to-scale) );\n\tmargin-bottom: calc(-1em * var(--leading-trim-top));\n}\n\n.text-12::after{\n\tcontent: \"\";\n\tdisplay: table;\n\t--line-height-normal: calc(var(--line-height-scale) * var(--font-size-px));\n\t--specified-line-height-offset-double: calc(var(--line-height-normal) - var(--line-height-px));\n\t--specified-line-height-offset: calc(var(--specified-line-height-offset-double) / 2 );\n\t--specified-line-height-offset-to-scale: calc(var(--specified-line-height-offset) / var(--font-size-px));\n\t--prevent-collapse-to-scale: calc(var(--prevent-collapse) / var(--font-size-px));\n\t--line-gap-scale-half: calc(var(--line-gap-scale) / 2);\n\t--leading-trim-bottom: calc( var(--descent-scale) + var(--line-gap-scale-half) - var(--specified-line-height-offset-to-scale) );\n\tmargin-top: calc(-1em * var(--leading-trim-bottom));\n}\n\n.text-14{\n\tfont-size: 14px;\n\t--font-size-px: 14;\n\t--line-height-px: calc(var(--line-height-unitless) * var(--font-size-px));\n}\n\n.text-14::before{\n\tcontent: \"\";\n\tdisplay: table;\n\t--line-height-normal: calc(var(--line-height-scale) * var(--font-size-px));\n\t--specified-line-height-offset-double: calc(var(--line-height-normal) - var(--line-height-px));\n\t--specified-line-height-offset: calc(var(--specified-line-height-offset-double) / 2 );\n\t--specified-line-height-offset-to-scale: calc(var(--specified-line-height-offset) / var(--font-size-px));\n\t--line-gap-scale-half: calc(var(--line-gap-scale) / 2);\n\t--leading-trim-top: calc( var(--ascent-scale) - var(--cap-height-scale) + var(--line-gap-scale-half) - var(--specified-line-height-offset-to-scale) );\n\tmargin-bottom: calc(-1em * var(--leading-trim-top));\n}\n\n.text-14::after{\n\tcontent: \"\";\n\tdisplay: table;\n\t--line-height-normal: calc(var(--line-height-scale) * var(--font-size-px));\n\t--specified-line-height-offset-double: calc(var(--line-height-normal) - var(--line-height-px));\n\t--specified-line-height-offset: calc(var(--specified-line-height-offset-double) / 2 );\n\t--specified-line-height-offset-to-scale: calc(var(--specified-line-height-offset) / var(--font-size-px));\n\t--prevent-collapse-to-scale: calc(var(--prevent-collapse) / var(--font-size-px));\n\t--line-gap-scale-half: calc(var(--line-gap-scale) / 2);\n\t--leading-trim-bottom: calc( var(--descent-scale) + var(--line-gap-scale-half) - var(--specified-line-height-offset-to-scale) );\n\tmargin-top: calc(-1em * var(--leading-trim-bottom));\n}\n\n.text-16{\n\tfont-size: 16px;\n\t--font-size-px: 16;\n\t--line-height-px: calc(var(--line-height-unitless) * var(--font-size-px));\n}\n\n.text-16::before{\n\tcontent: \"\";\n\tdisplay: table;\n\t--line-height-normal: calc(var(--line-height-scale) * var(--font-size-px));\n\t--specified-line-height-offset-double: calc(var(--line-height-normal) - var(--line-height-px));\n\t--specified-line-height-offset: calc(var(--specified-line-height-offset-double) / 2 );\n\t--specified-line-height-offset-to-scale: calc(var(--specified-line-height-offset) / var(--font-size-px));\n\t--line-gap-scale-half: calc(var(--line-gap-scale) / 2);\n\t--leading-trim-top: calc( var(--ascent-scale) - var(--cap-height-scale) + var(--line-gap-scale-half) - var(--specified-line-height-offset-to-scale) );\n\tmargin-bottom: calc(-1em * var(--leading-trim-top));\n}\n\n.text-16::after{\n\tcontent: \"\";\n\tdisplay: table;\n\t--line-height-normal: calc(var(--line-height-scale) * var(--font-size-px));\n\t--specified-line-height-offset-double: calc(var(--line-height-normal) - var(--line-height-px));\n\t--specified-line-height-offset: calc(var(--specified-line-height-offset-double) / 2 );\n\t--specified-line-height-offset-to-scale: calc(var(--specified-line-height-offset) / var(--font-size-px));\n\t--prevent-collapse-to-scale: calc(var(--prevent-collapse) / var(--font-size-px));\n\t--line-gap-scale-half: calc(var(--line-gap-scale) / 2);\n\t--leading-trim-bottom: calc( var(--descent-scale) + var(--line-gap-scale-half) - var(--specified-line-height-offset-to-scale) );\n\tmargin-top: calc(-1em * var(--leading-trim-bottom));\n}\n\n.text-20{\n\tfont-size: 20px;\n\t--font-size-px: 20;\n\t--line-height-px: calc(var(--line-height-unitless) * var(--font-size-px));\n}\n\n.text-20::before{\n\tcontent: \"\";\n\tdisplay: table;\n\t--line-height-normal: calc(var(--line-height-scale) * var(--font-size-px));\n\t--specified-line-height-offset-double: calc(var(--line-height-normal) - var(--line-height-px));\n\t--specified-line-height-offset: calc(var(--specified-line-height-offset-double) / 2 );\n\t--specified-line-height-offset-to-scale: calc(var(--specified-line-height-offset) / var(--font-size-px));\n\t--line-gap-scale-half: calc(var(--line-gap-scale) / 2);\n\t--leading-trim-top: calc( var(--ascent-scale) - var(--cap-height-scale) + var(--line-gap-scale-half) - var(--specified-line-height-offset-to-scale) );\n\tmargin-bottom: calc(-1em * var(--leading-trim-top));\n}\n\n.text-20::after{\n\tcontent: \"\";\n\tdisplay: table;\n\t--line-height-normal: calc(var(--line-height-scale) * var(--font-size-px));\n\t--specified-line-height-offset-double: calc(var(--line-height-normal) - var(--line-height-px));\n\t--specified-line-height-offset: calc(var(--specified-line-height-offset-double) / 2 );\n\t--specified-line-height-offset-to-scale: calc(var(--specified-line-height-offset) / var(--font-size-px));\n\t--prevent-collapse-to-scale: calc(var(--prevent-collapse) / var(--font-size-px));\n\t--line-gap-scale-half: calc(var(--line-gap-scale) / 2);\n\t--leading-trim-bottom: calc( var(--descent-scale) + var(--line-gap-scale-half) - var(--specified-line-height-offset-to-scale) );\n\tmargin-top: calc(-1em * var(--leading-trim-bottom));\n}\n\n.text-24{\n\tfont-size: 24px;\n\t--font-size-px: 24;\n\t--line-height-px: calc(var(--line-height-unitless) * var(--font-size-px));\n}\n\n.text-24::before{\n\tcontent: \"\";\n\tdisplay: table;\n\t--line-height-normal: calc(var(--line-height-scale) * var(--font-size-px));\n\t--specified-line-height-offset-double: calc(var(--line-height-normal) - var(--line-height-px));\n\t--specified-line-height-offset: calc(var(--specified-line-height-offset-double) / 2 );\n\t--specified-line-height-offset-to-scale: calc(var(--specified-line-height-offset) / var(--font-size-px));\n\t--line-gap-scale-half: calc(var(--line-gap-scale) / 2);\n\t--leading-trim-top: calc( var(--ascent-scale) - var(--cap-height-scale) + var(--line-gap-scale-half) - var(--specified-line-height-offset-to-scale) );\n\tmargin-bottom: calc(-1em * var(--leading-trim-top));\n}\n\n.text-24::after{\n\tcontent: \"\";\n\tdisplay: table;\n\t--line-height-normal: calc(var(--line-height-scale) * var(--font-size-px));\n\t--specified-line-height-offset-double: calc(var(--line-height-normal) - var(--line-height-px));\n\t--specified-line-height-offset: calc(var(--specified-line-height-offset-double) / 2 );\n\t--specified-line-height-offset-to-scale: calc(var(--specified-line-height-offset) / var(--font-size-px));\n\t--prevent-collapse-to-scale: calc(var(--prevent-collapse) / var(--font-size-px));\n\t--line-gap-scale-half: calc(var(--line-gap-scale) / 2);\n\t--leading-trim-bottom: calc( var(--descent-scale) + var(--line-gap-scale-half) - var(--specified-line-height-offset-to-scale) );\n\tmargin-top: calc(-1em * var(--leading-trim-bottom));\n}\n\n.leading-none{\n\tline-height: 1;\n\t--line-height-unitless: 1;\n\t--line-height-px: calc(var(--line-height-unitless) * var(--font-size-px));\n}\n\n.leading-1_1{\n\tline-height: 1.1;\n\t--line-height-unitless: 1.1;\n\t--line-height-px: calc(var(--line-height-unitless) * var(--font-size-px));\n}\n\n.leading-1_4{\n\tline-height: 1.4;\n\t--line-height-unitless: 1.4;\n\t--line-height-px: calc(var(--line-height-unitless) * var(--font-size-px));\n}\n\n.leading-1_5{\n\tline-height: 1.5;\n\t--line-height-unitless: 1.5;\n\t--line-height-px: calc(var(--line-height-unitless) * var(--font-size-px));\n}\n\n:root {\n\t/* Skip @reach styles */\n\t--reach-dialog: 1;\n}\n\n.root {\n\t-moz-osx-font-smoothing: grayscale;\n\t-webkit-font-smoothing: antialiased;\n}\n\n.hover\\:border-purple-40:hover{\n\t--tw-border-opacity: 1;\n\tborder-color: rgba(52, 64, 156, var(--tw-border-opacity));\n}\n\n.hover\\:border-slate-70:hover{\n\t--tw-border-opacity: 1;\n\tborder-color: rgba(188, 190, 205, var(--tw-border-opacity));\n}\n\n.hover\\:bg-purple-40:hover{\n\t--tw-bg-opacity: 1;\n\tbackground-color: rgba(52, 64, 156, var(--tw-bg-opacity));\n}\n\n.hover\\:bg-white:hover{\n\t--tw-bg-opacity: 1;\n\tbackground-color: rgba(255, 255, 255, var(--tw-bg-opacity));\n}\n\n.hover\\:bg-opacity-10:hover{\n\t--tw-bg-opacity: 0.1;\n}\n\n.hover\\:text-slate-30:hover{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(74, 86, 105, var(--tw-text-opacity));\n}\n\n.hover\\:text-slate-60:hover{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(136, 140, 165, var(--tw-text-opacity));\n}\n\n.hover\\:text-white:hover{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(255, 255, 255, var(--tw-text-opacity));\n}\n\n.hover\\:text-purple-40:hover{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(52, 64, 156, var(--tw-text-opacity));\n}\n\n.focus\\:border-slate-70:focus{\n\t--tw-border-opacity: 1;\n\tborder-color: rgba(188, 190, 205, var(--tw-border-opacity));\n}\n\n.focus\\:bg-purple-40:focus{\n\t--tw-bg-opacity: 1;\n\tbackground-color: rgba(52, 64, 156, var(--tw-bg-opacity));\n}\n\n.focus\\:bg-white:focus{\n\t--tw-bg-opacity: 1;\n\tbackground-color: rgba(255, 255, 255, var(--tw-bg-opacity));\n}\n\n.focus\\:bg-opacity-10:focus{\n\t--tw-bg-opacity: 0.1;\n}\n\n.focus\\:text-slate-30:focus{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(74, 86, 105, var(--tw-text-opacity));\n}\n\n.focus\\:text-slate-60:focus{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(136, 140, 165, var(--tw-text-opacity));\n}\n\n.focus\\:text-white:focus{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(255, 255, 255, var(--tw-text-opacity));\n}\n\n.focus\\:text-purple-40:focus{\n\t--tw-text-opacity: 1;\n\tcolor: rgba(52, 64, 156, var(--tw-text-opacity));\n}\n\n@media (min-width: 640px){\n\n\t.sm\\:top-6{\n\t\ttop: 1.5rem;\n\t}\n\n\t.sm\\:right-6{\n\t\tright: 1.5rem;\n\t}\n\n\t.sm\\:hidden{\n\t\tdisplay: none;\n\t}\n\n\t.sm\\:gap-7{\n\t\tgap: 1.75rem;\n\t}\n\n\t.sm\\:px-10{\n\t\tpadding-left: 2.5rem;\n\t\tpadding-right: 2.5rem;\n\t}\n\n\t.sm\\:text-14{\n\t\tfont-size: 14px;\n\t\t--font-size-px: 14;\n\t\t--line-height-px: calc(var(--line-height-unitless) * var(--font-size-px));\n\t}\n\n\t.sm\\:text-14::before{\n\t\tcontent: \"\";\n\t\tdisplay: table;\n\t\t--line-height-normal: calc(var(--line-height-scale) * var(--font-size-px));\n\t\t--specified-line-height-offset-double: calc(var(--line-height-normal) - var(--line-height-px));\n\t\t--specified-line-height-offset: calc(var(--specified-line-height-offset-double) / 2 );\n\t\t--specified-line-height-offset-to-scale: calc(var(--specified-line-height-offset) / var(--font-size-px));\n\t\t--line-gap-scale-half: calc(var(--line-gap-scale) / 2);\n\t\t--leading-trim-top: calc( var(--ascent-scale) - var(--cap-height-scale) + var(--line-gap-scale-half) - var(--specified-line-height-offset-to-scale) );\n\t\tmargin-bottom: calc(-1em * var(--leading-trim-top));\n\t}\n\n\t.sm\\:text-14::after{\n\t\tcontent: \"\";\n\t\tdisplay: table;\n\t\t--line-height-normal: calc(var(--line-height-scale) * var(--font-size-px));\n\t\t--specified-line-height-offset-double: calc(var(--line-height-normal) - var(--line-height-px));\n\t\t--specified-line-height-offset: calc(var(--specified-line-height-offset-double) / 2 );\n\t\t--specified-line-height-offset-to-scale: calc(var(--specified-line-height-offset) / var(--font-size-px));\n\t\t--prevent-collapse-to-scale: calc(var(--prevent-collapse) / var(--font-size-px));\n\t\t--line-gap-scale-half: calc(var(--line-gap-scale) / 2);\n\t\t--leading-trim-bottom: calc( var(--descent-scale) + var(--line-gap-scale-half) - var(--specified-line-height-offset-to-scale) );\n\t\tmargin-top: calc(-1em * var(--leading-trim-bottom));\n\t}\n}\n";
var styles = css_248z;

const Root = ({ children }) => {
  return /* @__PURE__ */ React.createElement(root.div, null, /* @__PURE__ */ React.createElement("div", {
    className: "root"
  }, children), /* @__PURE__ */ React.createElement("style", {
    type: "text/css"
  }, styles));
};

const CloseSVG = (props) => /* @__PURE__ */ React.createElement("svg", {
  viewBox: "0 0 18 18",
  xmlns: "http://www.w3.org/2000/svg",
  ...props
}, /* @__PURE__ */ React.createElement("path", {
  d: "m297.612899 76.2097046.094208.0831886 7.292893 7.2921068 7.292893-7.2921068c.390525-.3905243 1.023689-.3905243 1.414214 0 .360484.360484.388213.927715.083188 1.3200062l-.083188.0942074-7.292107 7.2928932 7.292107 7.2928932c.390524.3905243.390524 1.0236893 0 1.4142136-.360484.3604839-.927715.3882135-1.320006.0831886l-.094208-.0831886-7.292893-7.2921068-7.292893 7.2921068c-.390525.3905243-1.023689.3905243-1.414214 0-.360484-.360484-.388213-.927715-.083188-1.3200062l.083188-.0942074 7.292107-7.2928932-7.292107-7.2928932c-.390524-.3905243-.390524-1.0236893 0-1.4142136.360484-.3604839.927715-.3882135 1.320006-.0831886z",
  fill: "currentColor",
  transform: "translate(-296 -76)"
}));
const PrismicLogo = ({
  fillWhite,
  ...props
}) => /* @__PURE__ */ React.createElement("svg", {
  viewBox: "0 0 45 45",
  xmlns: "http://www.w3.org/2000/svg",
  ...props
}, /* @__PURE__ */ React.createElement("g", {
  fill: "none"
}, /* @__PURE__ */ React.createElement("path", {
  d: "M39.19 1.534a10.38 10.38 0 014.292 4.341C44.472 7.747 45 9.605 45 14.723v8.99c0 .116-.07.22-.176.265a.283.283 0 01-.31-.062v-.001l-3.358-3.395a1.443 1.443 0 01-.416-1.016V15.35c0-3.84-.396-5.232-1.138-6.636a7.785 7.785 0 00-3.22-3.255c-1.374-.744-2.737-1.143-6.444-1.15l-5.551-.001a.285.285 0 01-.262-.178.289.289 0 01.062-.312L27.545.42C27.81.151 28.172 0 28.549 0h1.889c5.063 0 6.9.533 8.751 1.534zM32.22 7.178c3.137 0 5.68 2.572 5.68 5.743v3.636a.287.287 0 01-.174.262.282.282 0 01-.307-.056l-4.58-4.425a2.83 2.83 0 00-1.035-.668 2.806 2.806 0 00-1.004-.185H17.284a.285.285 0 01-.262-.177.289.289 0 01.061-.313l3.364-3.397c.265-.268.626-.42 1.003-.42z",
  fill: fillWhite ? "white" : "#e55638"
}), /* @__PURE__ */ React.createElement("path", {
  d: "M41.182 24.185l3.397 3.359c.269.266.421.628.421 1.005v1.89c0 5.062-.533 6.899-1.535 8.75a10.38 10.38 0 01-4.34 4.295c-1.873.988-3.73 1.516-8.85 1.516h-8.989a.288.288 0 01-.264-.176.281.281 0 01.062-.309v.002l3.396-3.36a1.443 1.443 0 011.015-.416h4.155c3.84 0 5.231-.395 6.635-1.139a7.786 7.786 0 003.257-3.22c.75-1.388 1.15-2.765 1.15-6.564v-5.433c.001-.114.071-.217.178-.26a.29.29 0 01.312.06zm-7.177-7.102l3.397 3.363c.269.266.42.627.42 1.005v10.772c0 3.137-2.571 5.68-5.743 5.68h-3.636a.288.288 0 01-.263-.172.281.281 0 01.056-.307v-.002l4.425-4.58c.307-.303.53-.657.669-1.036.122-.32.184-.66.184-1.003v-13.52c0-.114.07-.217.178-.261a.29.29 0 01.313.061z",
  fill: fillWhite ? "white" : "#f4c942"
}), /* @__PURE__ */ React.createElement("path", {
  d: "M.484 21.083l3.361 3.396c.266.269.417.635.417 1.016v4.155c0 3.84.394 5.232 1.138 6.636a7.785 7.785 0 003.22 3.256c1.388.751 2.766 1.15 6.563 1.15h5.431a.289.289 0 01.202.49l-3.36 3.397a1.41 1.41 0 01-1.003.421h-1.89c-5.063 0-6.899-.533-8.75-1.534a10.38 10.38 0 01-4.295-4.342C.538 37.271.01 35.432 0 30.43v-9.143c0-.116.07-.22.175-.264a.283.283 0 01.31.06zm7.097 7.153h-.002l4.582 4.426c.302.306.658.528 1.035.667.31.12.65.185 1.004.185h13.517c.115 0 .218.071.262.178.043.107.019.23-.062.312l-3.362 3.398c-.266.268-.628.42-1.003.42H12.779a5.66 5.66 0 01-4.018-1.685A5.763 5.763 0 017.1 32.078v-3.635c0-.115.069-.218.173-.263a.283.283 0 01.308.056z",
  fill: fillWhite ? "white" : "#7b8fea"
}), /* @__PURE__ */ React.createElement("path", {
  d: "M16.557 7.1c.115 0 .218.068.263.173a.281.281 0 01-.056.307l-4.426 4.582a2.814 2.814 0 00-.668 1.035c-.123.32-.185.66-.185 1.003V27.72c-.001.114-.071.216-.178.26s-.23.02-.312-.06l-3.397-3.363a1.412 1.412 0 01-.42-1.004V12.78c0-3.137 2.571-5.68 5.743-5.68zM23.714 0c.116 0 .22.07.264.176a.281.281 0 01-.062.309L20.52 3.844c-.27.266-.634.416-1.015.416H15.35c-3.84 0-5.232.395-6.637 1.139a7.785 7.785 0 00-3.256 3.22c-.743 1.373-1.142 2.736-1.15 6.444v5.552c-.001.114-.071.217-.178.26a.29.29 0 01-.313-.06L.422 17.458A1.411 1.411 0 010 16.452v-1.89C0 9.5.533 7.663 1.535 5.812a10.38 10.38 0 014.34-4.295C7.73.537 9.568.011 14.57 0z",
  fill: fillWhite ? "white" : "#d97ee8"
})));
const Modal = ({
  variant = "base",
  repositoryName,
  onDismiss,
  isOpen,
  children,
  "aria-label": ariaLabel
}) => {
  return /* @__PURE__ */ React.createElement(DialogOverlay, {
    isOpen,
    onDismiss,
    dangerouslyBypassFocusLock: true
  }, /* @__PURE__ */ React.createElement(DialogContent, {
    "aria-label": ariaLabel
  }, /* @__PURE__ */ React.createElement(Root, null, /* @__PURE__ */ React.createElement("div", {
    className: "z-max bg-black bg-opacity-60 fixed inset-0 overflow-auto"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "w-full max-w-34rem mx-auto mt-20vh px-4"
  }, /* @__PURE__ */ React.createElement("div", {
    className: clsx("rounded-lg shadow-lg px-7 py-8 relative sm:px-10", variant === "base" && "bg-white text-slate-30", variant === "red" && "bg-red-40 text-white"),
    "data-gatsby-plugin-prismic-previews-repository-name": repositoryName
  }, /* @__PURE__ */ React.createElement("div", {
    className: "grid gap-7"
  }, /* @__PURE__ */ React.createElement(PrismicLogo, {
    fillWhite: variant === "red",
    className: "block mx-auto w-11 h-11"
  }), /* @__PURE__ */ React.createElement("div", null, children)), /* @__PURE__ */ React.createElement("button", {
    className: clsx("absolute top-5 right-5 transition  sm:top-6 sm:right-6 p-2 -m-2", variant === "base" && "text-slate-90 hover:text-slate-60 focus:text-slate-60", variant === "red" && "text-red-80 hover:text-white focus:text-white"),
    onClick: onDismiss
  }, /* @__PURE__ */ React.createElement("span", {
    className: "sr-only"
  }, "Close modal"), /* @__PURE__ */ React.createElement(CloseSVG, {
    className: "w-5 h-5"
  }))))))));
};

const Button = ({
  className,
  variant,
  ...props
}) => /* @__PURE__ */ React.createElement("button", {
  ...props,
  className: clsx("py-4 px-5 text-center rounded min-w-7.5rem border", variant === "purple" && "bg-purple-50 text-white border-purple-50 transition hover:bg-purple-40 focus:bg-purple-40 hover:border-purple-40 focus:borer-purple-40", variant === "white" && "bg-white border-slate-90 text-slate-60 hover:border-slate-70 focus:border-slate-70 hover:text-slate-30 focus:text-slate-30 transition", variant === "whiteOutline" && "bg-transparent border-white text-white hover:bg-white hover:bg-opacity-10 focus:bg-white focus:bg-opacity-10 transition", className)
});

const defaultElement = "div";
const variants = {
  "sans-12": {
    fontFamilyClassName: "font-sans",
    fontSizeClassName: "text-12",
    leadingClassName: "leading-1_5",
    trackingClassName: void 0
  },
  "sans-12-14": {
    fontFamilyClassName: "font-sans",
    fontSizeClassName: "text-12 sm:text-14",
    leadingClassName: "leading-1_5",
    trackingClassName: void 0
  },
  "sans-14": {
    fontFamilyClassName: "font-sans",
    fontSizeClassName: "text-14",
    leadingClassName: "leading-1_1",
    trackingClassName: void 0
  },
  "sans-16": {
    fontFamilyClassName: "font-sans",
    fontSizeClassName: "text-16",
    leadingClassName: "leading-1_1",
    trackingClassName: void 0
  },
  "sans-24": {
    fontFamilyClassName: "font-sans",
    fontSizeClassName: "text-24",
    leadingClassName: "leading-1_1",
    trackingClassName: "tracking-tight"
  },
  "mono-20": {
    fontFamilyClassName: "font-mono",
    fontSizeClassName: "text-20",
    leadingClassName: "leading-1_4",
    trackingClassName: void 0
  }
};
const Text = ({
  as,
  variant: variantName,
  fontFamilyClassName,
  fontSizeClassName,
  leadingClassName,
  trackingClassName,
  className,
  ...restProps
}) => {
  const Element = as != null ? as : defaultElement;
  const variant = variants[variantName];
  return /* @__PURE__ */ React.createElement(Element, {
    ...restProps,
    className: clsx(fontFamilyClassName != null ? fontFamilyClassName : variant.fontFamilyClassName, fontSizeClassName != null ? fontSizeClassName : variant.fontSizeClassName, leadingClassName != null ? leadingClassName : variant.leadingClassName, trackingClassName != null ? trackingClassName : variant.trackingClassName, className)
  });
};

const PRISMIC_DOCS_GENERATING_AN_ACCESS_TOKEN = "https://user-guides.prismic.io/en/articles/1036153-generating-an-access-token";
const ModalAccessToken = ({
  repositoryName,
  state = "IDLE",
  initialAccessToken = "",
  afterSubmit,
  setAccessToken,
  isOpen,
  onDismiss
}) => {
  const [ephemeralAccessToken, setEphemeralAccessToken] = React.useState(initialAccessToken);
  React.useEffect(() => {
    setEphemeralAccessToken(initialAccessToken);
  }, [initialAccessToken]);
  const onAccessTokenChange = (event) => setEphemeralAccessToken(event.currentTarget.value);
  const onSubmit = (event) => {
    event.preventDefault();
    setAccessToken(ephemeralAccessToken);
    if (afterSubmit) {
      afterSubmit();
    }
  };
  return /* @__PURE__ */ React.createElement(Modal, {
    repositoryName,
    onDismiss,
    isOpen,
    "aria-label": `Prismic access token for ${repositoryName}`
  }, /* @__PURE__ */ React.createElement("div", {
    className: "grid gap-6 sm:gap-7"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "grid gap-5"
  }, /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-24",
    className: "text-slate-10 text-center font-semibold"
  }, "Enter your Prismic ", /* @__PURE__ */ React.createElement("br", {
    className: "sm:hidden"
  }), "access token"), /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-12-14",
    className: "text-center"
  }, "An access token is required to view this preview.", /* @__PURE__ */ React.createElement("br", null), "Repository Name:", " ", /* @__PURE__ */ React.createElement("strong", {
    className: "font-medium text-slate-10"
  }, repositoryName))), /* @__PURE__ */ React.createElement("form", {
    onSubmit,
    className: "grid gap-5"
  }, /* @__PURE__ */ React.createElement("label", {
    className: "grid gap-3"
  }, /* @__PURE__ */ React.createElement("span", {
    className: "sr-only"
  }, "Access token"), /* @__PURE__ */ React.createElement("input", {
    name: "access-token",
    placeholder: "your-access-token",
    value: ephemeralAccessToken,
    spellCheck: false,
    required: true,
    onChange: onAccessTokenChange,
    className: clsx("border rounded px-5 py-3 block font-mono text-base leading-none w-full", !ephemeralAccessToken && "text-center", state === "IDLE" && "border-slate-90 bg-slate-95 text-slate-30 placeholder-slate-70", state === "INCORRECT" && "border-red-40 bg-red-95 text-red-40 placeholder-red-80")
  }), state === "INCORRECT" && /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-12-14",
    className: "text-red-40 font-semibold text-center"
  }, "Incorrect token")), /* @__PURE__ */ React.createElement("ul", {
    className: "-ml-4 -mt-4 flex flex-wrap justify-center pointer-events-none"
  }, /* @__PURE__ */ React.createElement("li", {
    className: "pl-4 pt-4 pointer-events-auto"
  }, /* @__PURE__ */ React.createElement(Button, {
    variant: "white",
    type: "button",
    onClick: onDismiss
  }, /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-14",
    className: "font-semibold"
  }, "Cancel"))), /* @__PURE__ */ React.createElement("li", {
    className: "pl-4 pt-4 pointer-events-auto"
  }, /* @__PURE__ */ React.createElement(Button, {
    variant: "purple",
    type: "submit"
  }, /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-14",
    className: "font-semibold"
  }, "Continue"))))), /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-12",
    className: "text-center"
  }, "Not sure what your access token is? ", /* @__PURE__ */ React.createElement("br", {
    className: "sm:hidden"
  }), /* @__PURE__ */ React.createElement("a", {
    href: PRISMIC_DOCS_GENERATING_AN_ACCESS_TOKEN,
    target: "_blank",
    rel: "noopener noreferrer nofollow",
    className: "text-purple-50 focus:text-purple-40 hover:text-purple-40 transition"
  }, "Learn about generating one here."))));
};

const ModalError = ({
  repositoryName,
  errorMessage,
  isOpen,
  onDismiss
}) => {
  return /* @__PURE__ */ React.createElement(Modal, {
    variant: "red",
    repositoryName,
    onDismiss,
    isOpen,
    "aria-label": `Prismic preview error for ${repositoryName}`
  }, /* @__PURE__ */ React.createElement("div", {
    className: "grid gap-6 sm:gap-7 justify-items-center"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "grid gap-4"
  }, /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-24",
    className: "text-center font-semibold"
  }, "Error"), /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-12-14",
    className: "text-center"
  }, "The preview could not be loaded.")), errorMessage && /* @__PURE__ */ React.createElement(Text, {
    variant: "mono-20",
    className: "text-center my-2"
  }, errorMessage), /* @__PURE__ */ React.createElement(Button, {
    variant: "whiteOutline",
    onClick: onDismiss,
    className: "mx-auto"
  }, /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-14",
    className: "font-medium"
  }, "Cancel Preview")), /* @__PURE__ */ React.createElement("dl", {
    className: "text-red-80 flex flex-wrap -mt-5 -ml-5 justify-center"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "grid gap-2 pl-5 pt-5 grid-flow-col"
  }, /* @__PURE__ */ React.createElement("dt", null, /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-12",
    className: "font-semibold"
  }, "Repository")), /* @__PURE__ */ React.createElement("dd", null, /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-12"
  }, repositoryName))), /* @__PURE__ */ React.createElement("div", {
    className: "grid gap-2 pl-5 pt-5 grid-flow-col"
  }, /* @__PURE__ */ React.createElement("dt", null, /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-12",
    className: "font-semibold"
  }, "Plugin Version")), /* @__PURE__ */ React.createElement("dd", null, /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-12"
  }, VERSION))))));
};

const ModalLoading = ({
  repositoryName,
  isOpen,
  onDismiss
}) => {
  return /* @__PURE__ */ React.createElement(Modal, {
    repositoryName,
    onDismiss,
    isOpen,
    "aria-label": `Prismic preview loading for ${repositoryName}`
  }, /* @__PURE__ */ React.createElement("div", {
    className: "grid gap-6 sm:gap-7 justify-items-center"
  }, /* @__PURE__ */ React.createElement("div", {
    className: "grid gap-5"
  }, /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-24",
    className: "text-slate-10 text-center font-semibold"
  }, "Fetching preview"), /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-12-14",
    className: "text-center"
  }, "Please wait while your updates are loading\u2026")), /* @__PURE__ */ React.createElement(Button, {
    variant: "white",
    onClick: onDismiss,
    className: "mx-auto"
  }, /* @__PURE__ */ React.createElement(Text, {
    variant: "sans-14",
    className: "font-medium"
  }, "Cancel Preview"))));
};

const PrismicPreviewUI = ({
  afterAccessTokenSet
}) => {
  const [state, dispatch] = usePrismicPreviewContext();
  const [accessToken, accessTokenActions] = usePrismicPreviewAccessToken(state.activeRepositoryName);
  const goToIdle = () => dispatch({ type: PrismicContextActionType.GoToIdle });
  return /* @__PURE__ */ React.createElement(React.Fragment, null, state.activeRepositoryName && /* @__PURE__ */ React.createElement(Root, null, /* @__PURE__ */ React.createElement(ModalLoading, {
    isOpen: state.previewState === PrismicPreviewState.BOOTSTRAPPING || state.previewState === PrismicPreviewState.RESOLVING,
    repositoryName: state.activeRepositoryName,
    onDismiss: goToIdle
  }), /* @__PURE__ */ React.createElement(ModalAccessToken, {
    isOpen: state.previewState === PrismicPreviewState.PROMPT_FOR_ACCESS_TOKEN,
    repositoryName: state.activeRepositoryName,
    state: accessToken ? "INCORRECT" : "IDLE",
    initialAccessToken: accessToken,
    setAccessToken: accessTokenActions.set,
    afterSubmit: afterAccessTokenSet,
    onDismiss: goToIdle
  }), /* @__PURE__ */ React.createElement(ModalError, {
    isOpen: state.previewState === PrismicPreviewState.FAILED,
    repositoryName: state.activeRepositoryName,
    errorMessage: state.error ? userFriendlyError(state.error).message : void 0,
    onDismiss: goToIdle
  })));
};

const withPrismicPreview = (WrappedComponent, repositoryConfigs = [], config = {}) => {
  const WithPrismicPreview = (props) => {
    const [, contextDispatch] = usePrismicPreviewContext();
    const bootstrapPreview = usePrismicPreviewBootstrap(repositoryConfigs, {
      fetch: config.fetch
    });
    const mergedData = useMergePrismicPreviewData(props.data, {
      skip: config.mergePreviewData
    });
    const afterAccessTokenSet = React.useCallback(() => {
      contextDispatch({ type: PrismicContextActionType.GoToIdle });
      bootstrapPreview();
    }, [bootstrapPreview, contextDispatch]);
    React.useEffect(() => {
      bootstrapPreview();
    }, [bootstrapPreview]);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(WrappedComponent, {
      ...props,
      data: mergedData.data,
      isPrismicPreview: mergedData.isPreview,
      prismicPreviewOriginalData: props.data
    }), /* @__PURE__ */ React.createElement(PrismicPreviewUI, {
      afterAccessTokenSet
    }));
  };
  const wrappedComponentName = getComponentDisplayName(WrappedComponent);
  WithPrismicPreview.displayName = `withPrismicPreview(${wrappedComponentName})`;
  return WithPrismicPreview;
};

const withPrismicPreviewResolver = (WrappedComponent, repositoryConfigs = [], config = {}) => {
  const WithPrismicPreviewResolver = (props) => {
    const [contextState, contextDispatch] = usePrismicPreviewContext();
    const resolvePreview = usePrismicPreviewResolver(repositoryConfigs, {
      fetch: config.fetch
    });
    const isPreview = contextState.previewState === PrismicPreviewState.IDLE ? null : contextState.previewState !== PrismicPreviewState.NOT_PREVIEW;
    const afterAccessTokenSet = React.useCallback(() => {
      contextDispatch({ type: PrismicContextActionType.GoToIdle });
      resolvePreview();
    }, [resolvePreview, contextDispatch]);
    React.useEffect(() => {
      resolvePreview();
    }, [resolvePreview]);
    React.useEffect(() => {
      var _a;
      if (contextState.resolvedPath && ((_a = config.autoRedirect) != null ? _a : true)) {
        const navigate = config.navigate || gatsby.navigate;
        navigate(contextState.resolvedPath);
      }
    }, [contextState.resolvedPath]);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(WrappedComponent, {
      ...props,
      isPrismicPreview: isPreview,
      prismicPreviewPath: contextState.resolvedPath
    }), /* @__PURE__ */ React.createElement(PrismicPreviewUI, {
      afterAccessTokenSet
    }));
  };
  const wrappedComponentName = getComponentDisplayName(WrappedComponent);
  WithPrismicPreviewResolver.displayName = `withPrismicPreviewResolver(${wrappedComponentName})`;
  return WithPrismicPreviewResolver;
};

const camelCase = (...parts) => cc.camelCase(parts.filter((p) => p != null).join(" "), {
  transform: cc.camelCaseTransformMerge
});

const componentResolverFromMap = (componentMap) => (nodes) => {
  if (nodes.length > 0) {
    return componentMap[nodes[0].type] || null;
  } else {
    return null;
  }
};
const defaultDataResolver = (nodes, data) => {
  if (nodes.length > 0) {
    const key = camelCase(nodes[0].internal.type);
    return {
      ...data,
      [key]: nodes[0]
    };
  } else {
    return data;
  }
};
const useNodesForPath = (path) => {
  const [state, setState] = React.useState(0);
  const rerender = () => setState((i) => i + 1);
  const activeRuntime = useActiveRuntime();
  React.useEffect(() => {
    if (activeRuntime) {
      activeRuntime.subscribe(rerender);
    }
    return () => {
      if (activeRuntime) {
        activeRuntime.unsubscribe(rerender);
      }
    };
  }, [activeRuntime]);
  return React.useMemo(() => {
    state;
    return activeRuntime ? activeRuntime.nodes.filter((node) => node.url === path) : [];
  }, [state, path, activeRuntime]);
};
const useActiveRuntime = () => {
  const [contextState] = usePrismicPreviewContext();
  return React.useMemo(() => contextState.activeRepositoryName ? contextState.runtimeStore[contextState.activeRepositoryName] : void 0, [contextState.activeRepositoryName, contextState.runtimeStore]);
};
const useActiveRepositoryConfig = (repositoryConfigs = []) => {
  const [contextState] = usePrismicPreviewContext();
  return React.useMemo(() => [...repositoryConfigs, ...contextState.repositoryConfigs].find((config) => config.repositoryName === contextState.activeRepositoryName), [
    contextState.activeRepositoryName,
    contextState.repositoryConfigs,
    repositoryConfigs
  ]);
};
const withPrismicUnpublishedPreview = (WrappedComponent, repositoryConfigs, config = {}) => {
  const WithPrismicUnpublishedPreview = (props) => {
    const [contextState, contextDispatch] = usePrismicPreviewContext();
    const bootstrapPreview = usePrismicPreviewBootstrap(repositoryConfigs, {
      fetch: config.fetch
    });
    const nodesForPath = useNodesForPath(props.location.pathname);
    const repositoryConfig = useActiveRepositoryConfig(repositoryConfigs);
    const ResolvedComponent = React.useMemo(() => {
      var _a;
      return (_a = repositoryConfig == null ? void 0 : repositoryConfig.componentResolver(nodesForPath)) != null ? _a : WrappedComponent;
    }, [repositoryConfig, nodesForPath]);
    const resolvedData = React.useMemo(() => {
      const dataResolver = (repositoryConfig == null ? void 0 : repositoryConfig.dataResolver) || defaultDataResolver;
      return dataResolver(nodesForPath, props.data);
    }, [repositoryConfig == null ? void 0 : repositoryConfig.dataResolver, nodesForPath, props.data]);
    const afterAccessTokenSet = React.useCallback(() => {
      contextDispatch({ type: PrismicContextActionType.GoToIdle });
      bootstrapPreview();
    }, [bootstrapPreview, contextDispatch]);
    React.useEffect(() => {
      bootstrapPreview();
    }, [bootstrapPreview]);
    return contextState.previewState === PrismicPreviewState.ACTIVE ? /* @__PURE__ */ React.createElement(ResolvedComponent, {
      ...props,
      data: resolvedData
    }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(WrappedComponent, {
      ...props
    }), /* @__PURE__ */ React.createElement(PrismicPreviewUI, {
      afterAccessTokenSet
    }));
  };
  const wrappedComponentName = getComponentDisplayName(WrappedComponent);
  WithPrismicUnpublishedPreview.displayName = `withPrismicUnpublishedPreview(${wrappedComponentName})`;
  return WithPrismicUnpublishedPreview;
};

export { PrismicContext, PrismicContextActionType, PrismicPreviewProvider, PrismicPreviewState, componentResolverFromMap, contextReducer, defaultDataResolver, useMergePrismicPreviewData, usePrismicPreviewAccessToken, usePrismicPreviewBootstrap, usePrismicPreviewContext, usePrismicPreviewResolver, withPrismicPreview, withPrismicPreviewResolver, withPrismicUnpublishedPreview };
//# sourceMappingURL=index.js.map
