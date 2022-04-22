import * as React from "react";
import * as gatsbyPrismic from "gatsby-source-prismic";
import * as prismicT from "@prismicio/types";
import * as cookie from "es-cookie";

import { sprintf } from "./lib/sprintf";

import {
	COOKIE_ACCESS_TOKEN_NAME,
	WINDOW_PLUGIN_OPTIONS_KEY,
	WINDOW_PROVIDER_PRESENCE_KEY,
} from "./constants";
import {
	PluginOptions,
	PrismicRepositoryConfig,
	PrismicUnpublishedRepositoryConfigs,
} from "./types";

export type PrismicContextValue = readonly [
	PrismicContextState,
	React.Dispatch<PrismicContextAction>,
];

export enum PrismicPreviewState {
	IDLE = "IDLE",
	RESOLVING = "RESOLVING",
	RESOLVED = "RESOLVED",
	BOOTSTRAPPING = "BOOTSTRAPPING",
	ACTIVE = "ACTIVE",
	PROMPT_FOR_ACCESS_TOKEN = "PROMPT_FOR_ACCESS_TOKEN",
	FAILED = "FAILED",
	NOT_PREVIEW = "NOT_PREVIEW",
}

export type PrismicContextState = {
	/**
	 * The repository name of the preview session, if active.
	 */
	activeRepositoryName: string | undefined;
	/**
	 * The repository name of the preview session, if active.
	 */
	previewState: PrismicPreviewState;
	/**
	 * The error if the preview produced a failure.
	 */
	error?: Error;
	/**
	 * The resolved preview path if entered from a preview resolver page.
	 */
	resolvedPath?: string;
	/**
	 * Determines if all preview content has been fetched and prepared.
	 */
	isBootstrapped: boolean;
	/**
	 * Record of `gatsby-source-prismic` runtimes keyed by their repository name.
	 */
	runtimeStore: Record<string, gatsbyPrismic.Runtime>;
	/**
	 * Record of plugin options keyed by their repository name.
	 */
	pluginOptionsStore: Record<string, PluginOptions>;
	/**
	 * Configuration for each repository
	 */
	repositoryConfigs: PrismicUnpublishedRepositoryConfigs;
};

export enum PrismicContextActionType {
	SetActiveRepositoryName = "SetActiveRepositoryName",
	SetAccessToken = "SetAccessToken",

	SetupRuntime = "SetupRuntime",
	RegisterDocuments = "RegisterDocuments",
	ImportTypePaths = "ImportTypePaths",

	StartResolving = "StartResolving",
	Resolved = "Resolved",

	StartBootstrapping = "StartBootstrapping",
	Bootstrapped = "Bootstrapped",

	Failed = "Failed",
	NotAPreview = "NotAPreview",
	PromptForAccessToken = "PromptForAccessToken",

	GoToIdle = "GoToIdle",
}

export type PrismicContextAction =
	| {
			type: PrismicContextActionType.SetActiveRepositoryName;
			payload: { repositoryName: string };
	  }
	| {
			type: PrismicContextActionType.SetAccessToken;
			payload: { repositoryName: string; accessToken: string };
	  }
	| {
			type: PrismicContextActionType.SetupRuntime;
			payload: {
				repositoryName: string;
				repositoryConfig: PrismicRepositoryConfig;
				pluginOptions: PluginOptions;
			};
	  }
	| {
			type: PrismicContextActionType.RegisterDocuments;
			payload: {
				repositoryName: string;
				documents: prismicT.PrismicDocument[];
			};
	  }
	| {
			type: PrismicContextActionType.ImportTypePaths;
			payload: { repositoryName: string; typePathsExport: string };
	  }
	| {
			type: PrismicContextActionType.StartResolving;
	  }
	| {
			type: PrismicContextActionType.Resolved;
			payload: { path: string };
	  }
	| {
			type: PrismicContextActionType.StartBootstrapping;
	  }
	| {
			type: PrismicContextActionType.Bootstrapped;
	  }
	| {
			type: PrismicContextActionType.NotAPreview;
	  }
	| {
			type: PrismicContextActionType.PromptForAccessToken;
	  }
	| {
			type: PrismicContextActionType.Failed;
			payload: { error: Error };
	  }
	| {
			type: PrismicContextActionType.Failed;
			payload: { error: Error };
	  }
	| {
			type: PrismicContextActionType.GoToIdle;
	  };

export const contextReducer = (
	state: PrismicContextState,
	action: PrismicContextAction,
): PrismicContextState => {
	switch (action.type) {
		case PrismicContextActionType.SetActiveRepositoryName: {
			return {
				...state,
				activeRepositoryName: action.payload.repositoryName,
			};
		}

		case PrismicContextActionType.SetupRuntime: {
			const runtime = gatsbyPrismic.createRuntime({
				linkResolver: action.payload.repositoryConfig.linkResolver,
				htmlSerializer: action.payload.repositoryConfig.htmlSerializer,
				transformFieldName: action.payload.repositoryConfig.transformFieldName,
				typePrefix: action.payload.pluginOptions.typePrefix,
				imageImgixParams: action.payload.pluginOptions.imageImgixParams,
				imagePlaceholderImgixParams:
					action.payload.pluginOptions.imagePlaceholderImgixParams,
			});

			return {
				...state,
				runtimeStore: {
					...state.runtimeStore,
					[action.payload.repositoryName]: runtime,
				},
			};
		}

		case PrismicContextActionType.RegisterDocuments: {
			const runtime = state.runtimeStore[action.payload.repositoryName];

			if (runtime) {
				runtime.registerDocuments(action.payload.documents);
			} else {
				throw new Error(
					`A runtime for repository "${action.payload.repositoryName}" as not found`,
				);
			}

			return state;
		}

		case PrismicContextActionType.ImportTypePaths: {
			const runtime = state.runtimeStore[action.payload.repositoryName];

			if (runtime) {
				runtime.importTypePaths(action.payload.typePathsExport);
			} else {
				throw new Error(
					`A runtime for repository "${action.payload.repositoryName}" as not found`,
				);
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
						accessToken: action.payload.accessToken,
					},
				},
			};
		}

		case PrismicContextActionType.StartResolving: {
			return {
				...state,
				previewState: PrismicPreviewState.RESOLVING,
			};
		}

		case PrismicContextActionType.Resolved: {
			return {
				...state,
				previewState: PrismicPreviewState.RESOLVED,
				resolvedPath: action.payload.path,
			};
		}

		case PrismicContextActionType.StartBootstrapping: {
			return {
				...state,
				previewState: PrismicPreviewState.BOOTSTRAPPING,
				isBootstrapped: false,
			};
		}

		case PrismicContextActionType.Bootstrapped: {
			return {
				...state,
				previewState: PrismicPreviewState.ACTIVE,
				isBootstrapped: true,
			};
		}

		case PrismicContextActionType.Failed: {
			return {
				...state,
				previewState: PrismicPreviewState.FAILED,
				error: action.payload.error,
			};
		}

		case PrismicContextActionType.NotAPreview: {
			return {
				...state,
				previewState: PrismicPreviewState.NOT_PREVIEW,
			};
		}

		case PrismicContextActionType.PromptForAccessToken: {
			return {
				...state,
				previewState: PrismicPreviewState.PROMPT_FOR_ACCESS_TOKEN,
			};
		}

		case PrismicContextActionType.GoToIdle: {
			return {
				...state,
				previewState: PrismicPreviewState.IDLE,
			};
		}
	}
};

const defaultInitialState: PrismicContextState = {
	activeRepositoryName: undefined,
	previewState: PrismicPreviewState.IDLE,
	isBootstrapped: false,
	runtimeStore: {},
	pluginOptionsStore: {},
	repositoryConfigs: [],
};

const createInitialState = (
	repositoryConfigs = defaultInitialState.repositoryConfigs,
): PrismicContextState => {
	const pluginOptionsStore =
		typeof window === "undefined"
			? {}
			: window[WINDOW_PLUGIN_OPTIONS_KEY] || {};
	const repositoryNames = Object.keys(pluginOptionsStore);

	const injectedPluginOptionsStore = repositoryNames.reduce(
		(acc: Record<string, PluginOptions>, repositoryName) => {
			const persistedAccessTokenCookieName = sprintf(
				COOKIE_ACCESS_TOKEN_NAME,
				repositoryName,
			);
			const persistedAccessToken = cookie.get(persistedAccessTokenCookieName);

			acc[repositoryName] = pluginOptionsStore[repositoryName];

			if (acc[repositoryName].accessToken == null && persistedAccessToken) {
				acc[repositoryName].accessToken = persistedAccessToken;
			}

			return acc;
		},
		{},
	);

	return {
		...defaultInitialState,
		pluginOptionsStore: injectedPluginOptionsStore,
		repositoryConfigs,
	};
};

const defaultContextValue: PrismicContextValue = [
	defaultInitialState,
	() => void 0,
];

export const PrismicContext = React.createContext(defaultContextValue);

export type PrismicProviderProps = {
	repositoryConfigs?: PrismicUnpublishedRepositoryConfigs;
	children?: React.ReactNode;
};

export const PrismicPreviewProvider = ({
	repositoryConfigs,
	children,
}: PrismicProviderProps): JSX.Element => {
	const initialState = createInitialState(repositoryConfigs);
	const reducerTuple = React.useReducer(contextReducer, initialState);

	if (typeof window !== "undefined") {
		window[WINDOW_PROVIDER_PRESENCE_KEY] = true;
	}

	return (
		<PrismicContext.Provider value={reducerTuple}>
			{children}
		</PrismicContext.Provider>
	);
};
