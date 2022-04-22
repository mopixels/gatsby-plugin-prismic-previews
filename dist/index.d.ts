import * as gatsby from 'gatsby';
import * as imgixGatsby from '@imgix/gatsby';
import * as gatsbyPrismic from 'gatsby-source-prismic';
import * as prismic from '@prismicio/client';
import * as prismicT from '@prismicio/types';
import * as prismicH from '@prismicio/helpers';
import { SetRequired } from 'type-fest';
import * as React$1 from 'react';

/**
 * A universal API to make network requests. A subset of the `fetch()` API.
 */
declare type FetchLike = (input: string, init?: RequestInitLike) => Promise<ResponseLike>;
/**
 * The minimum required properties from RequestInit.
 */
interface RequestInitLike extends prismic.RequestInitLike {
    cache?: RequestCache;
}
/**
 * The minimum required properties from Response.
 */
interface ResponseLike extends prismic.ResponseLike {
    text(): Promise<string>;
}
interface PluginOptions extends gatsby.PluginOptions {
    repositoryName: string;
    accessToken?: string;
    promptForAccessToken?: boolean;
    apiEndpoint: string;
    routes?: prismic.Route[];
    graphQuery?: string;
    fetchLinks?: string[];
    lang: string;
    pageSize?: number;
    imageImgixParams: imgixGatsby.ImgixUrlParams;
    imagePlaceholderImgixParams: imgixGatsby.ImgixUrlParams;
    typePrefix?: string;
    toolbar: "new" | "legacy";
    plugins: [];
    writeTypePathsToFilesystem: (args: WriteTypePathsToFilesystemArgs) => void | Promise<void>;
}
declare type WriteTypePathsToFilesystemArgs = {
    publicPath: string;
    serializedTypePaths: string;
};
interface PrismicAPIDocumentNodeInput<TData extends Record<string, prismicT.AnyRegularField | prismicT.GroupField | prismicT.SliceZone> = Record<string, prismicT.AnyRegularField | prismicT.GroupField | prismicT.SliceZone>> extends prismicT.PrismicDocument<TData>, gatsby.NodeInput {
    prismicId: string;
}
declare type FieldNameTransformer = (fieldName: string) => string;
declare type UnknownRecord<K extends PropertyKey = PropertyKey> = Record<K, unknown>;
declare type PrismicRepositoryConfigs = PrismicRepositoryConfig[];
declare type PrismicUnpublishedRepositoryConfig = SetRequired<PrismicRepositoryConfig, "componentResolver">;
declare type PrismicUnpublishedRepositoryConfigs = PrismicUnpublishedRepositoryConfig[];
declare type PrismicRepositoryConfig = {
    /**
     * Name of the repository to be configured.
     */
    repositoryName: string;
    /**
     * Link Resolver for the repository. This should be the same Link Resolver
     * provided to `gatsby-source-prismic`'s plugin options.
     */
    linkResolver?: prismicH.LinkResolverFunction;
    /**
     * HTML Serializer for the repository. This should be the same HTML Serializer
     * provided to `gatsby-source-prismic`'s plugin options.
     */
    htmlSerializer?: prismicH.HTMLMapSerializer | prismicH.HTMLFunctionSerializer;
    /**
     * Field name transformer for the repository. This should be the same function
     * provided to `gatsby-source-prismic`'s `transformFieldName` plugin option.
     *
     * @param fieldName - Field name to transform.
     *
     * @returns Transformed version of `fieldName`.
     */
    transformFieldName?: FieldNameTransformer;
    /**
     * Determines the React component to render during an unpublished preview.
     * This function will be provided a list of nodes whose `url` field (computed
     * using your app's Link Resolver) matches the page's URL.
     *
     * @param nodes - List of nodes whose `url` field matches the page's URL.
     *
     * @returns The React component to render. If no component is returned, the
     *   wrapped component will be rendered.
     */
    componentResolver?<P>(nodes: gatsbyPrismic.NormalizedDocumentValue[]): React.ComponentType<P> | undefined | null;
    /**
     * Determines the data passed to a Gatsby page during an unpublished preview.
     * The value returned from this function is passed directly to the `data` prop.
     *
     * @param nodes - List of nodes that have URLs resolved to the current page.
     * @param data - The original page's `data` prop.
     *
     * @returns The value that will be passed to the page's `data` prop.
     */
    dataResolver?<TData extends Record<string, unknown>>(nodes: gatsbyPrismic.NormalizedDocumentValue[], data: TData): Record<string, unknown>;
};

declare type UsePrismicPreviewDataConfig = {
    /**
     * Determines if merging should be skipped.
     */
    skip?: boolean;
};
declare type UsePrismicPreviewDataResult<TStaticData extends UnknownRecord> = {
    /**
     * Data with previewed content merged if matching documents are found.
     */
    data: TStaticData;
    /**
     * Boolean determining if `data` contains previewed data.
     */
    isPreview: boolean;
};
/**
 * Merges static Prismic data with previewed data during a Prismic preview
 * session. If the static data finds previewable Prismic data (identified by the
 * `_previewable` field in a Prismic document), this hook will replace its value
 * with one from the preview session.
 *
 * The static data could come from page queries or `useStaticQuery` within a component.
 *
 * @param staticData - Static data from Gatsby's GraphQL layer.
 * @param config - Configuration that determines how the hook merges preview data.
 *
 * @returns An object containing the merged data and a boolean determining if
 *   the merged data contains preview data.
 */
declare const useMergePrismicPreviewData: <TStaticData extends UnknownRecord<PropertyKey>>(staticData: TStaticData, config?: UsePrismicPreviewDataConfig) => UsePrismicPreviewDataResult<TStaticData>;

declare type SetAccessTokenFn = (accessToken: string, remember?: boolean) => void;
declare type UsePrismicPreviewAccessTokenActions = {
    set: SetAccessTokenFn;
    removeCookie(): void;
};
/**
 * React hook that reads and sets a Prismic access token for a repository. This
 * hook can be used for multiple repositories by using it multiple times.
 *
 * @param repositoryName - Name of the repository.
 */
declare const usePrismicPreviewAccessToken: (repositoryName?: string | undefined) => readonly [
    accessToken: string | undefined,
    actions: UsePrismicPreviewAccessTokenActions
];

declare type UsePrismicPreviewBootstrapConfig = {
    fetch?: FetchLike;
};
declare type UsePrismicPreviewBootstrapFn = () => Promise<void>;
/**
 * React hook that bootstraps a Prismic preview session. When the returned
 * bootstrap function is called, the preiew session will be scoped to this
 * hook's Prismic repository. All documents from the repository will be fetched
 * using the preview session's documents.
 *
 * @param repositoryConfigs - Configuration that determines how the bootstrap
 *   function runs.
 */
declare const usePrismicPreviewBootstrap: (repositoryConfigs?: PrismicRepositoryConfigs, config?: UsePrismicPreviewBootstrapConfig) => UsePrismicPreviewBootstrapFn;

declare type PrismicContextValue = readonly [
    PrismicContextState,
    React$1.Dispatch<PrismicContextAction>
];
declare enum PrismicPreviewState {
    IDLE = "IDLE",
    RESOLVING = "RESOLVING",
    RESOLVED = "RESOLVED",
    BOOTSTRAPPING = "BOOTSTRAPPING",
    ACTIVE = "ACTIVE",
    PROMPT_FOR_ACCESS_TOKEN = "PROMPT_FOR_ACCESS_TOKEN",
    FAILED = "FAILED",
    NOT_PREVIEW = "NOT_PREVIEW"
}
declare type PrismicContextState = {
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
declare enum PrismicContextActionType {
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
    GoToIdle = "GoToIdle"
}
declare type PrismicContextAction = {
    type: PrismicContextActionType.SetActiveRepositoryName;
    payload: {
        repositoryName: string;
    };
} | {
    type: PrismicContextActionType.SetAccessToken;
    payload: {
        repositoryName: string;
        accessToken: string;
    };
} | {
    type: PrismicContextActionType.SetupRuntime;
    payload: {
        repositoryName: string;
        repositoryConfig: PrismicRepositoryConfig;
        pluginOptions: PluginOptions;
    };
} | {
    type: PrismicContextActionType.RegisterDocuments;
    payload: {
        repositoryName: string;
        documents: prismicT.PrismicDocument[];
    };
} | {
    type: PrismicContextActionType.ImportTypePaths;
    payload: {
        repositoryName: string;
        typePathsExport: string;
    };
} | {
    type: PrismicContextActionType.StartResolving;
} | {
    type: PrismicContextActionType.Resolved;
    payload: {
        path: string;
    };
} | {
    type: PrismicContextActionType.StartBootstrapping;
} | {
    type: PrismicContextActionType.Bootstrapped;
} | {
    type: PrismicContextActionType.NotAPreview;
} | {
    type: PrismicContextActionType.PromptForAccessToken;
} | {
    type: PrismicContextActionType.Failed;
    payload: {
        error: Error;
    };
} | {
    type: PrismicContextActionType.Failed;
    payload: {
        error: Error;
    };
} | {
    type: PrismicContextActionType.GoToIdle;
};
declare const contextReducer: (state: PrismicContextState, action: PrismicContextAction) => PrismicContextState;
declare const PrismicContext: React$1.Context<PrismicContextValue>;
declare type PrismicProviderProps = {
    repositoryConfigs?: PrismicUnpublishedRepositoryConfigs;
    children?: React$1.ReactNode;
};
declare const PrismicPreviewProvider: ({ repositoryConfigs, children, }: PrismicProviderProps) => JSX.Element;

declare type UsePrismicPreviewContextValue = readonly [
    PrismicContextState,
    React$1.Dispatch<PrismicContextAction>
];
/**
 * Returns the global state for Prismic preview sessions.
 */
declare const usePrismicPreviewContext: () => UsePrismicPreviewContextValue;

declare type UsePrismicPreviewResolverConfig = {
    fetch?: FetchLike;
};
declare type UsePrismicPreviewResolverFn = () => Promise<void>;
declare const usePrismicPreviewResolver: (repositoryConfigs?: PrismicRepositoryConfigs, config?: UsePrismicPreviewResolverConfig) => UsePrismicPreviewResolverFn;

interface WithPrismicPreviewProps<TStaticData extends UnknownRecord = UnknownRecord> {
    isPrismicPreview: boolean | null;
    prismicPreviewOriginalData: TStaticData;
}
declare type WithPrismicPreviewConfig = {
    mergePreviewData?: boolean;
    fetch?: FetchLike;
};
/**
 * A React higher order component (HOC) that wraps a Gatsby page to
 * automatically merge previewed content during a Prismic preview session.
 *
 * @param WrappedComponent - The Gatsby page component.
 * @param usePrismicPreviewBootstrapConfig - Configuration determining how the
 *   preview session is managed.
 * @param config - Configuration determining how the HOC handes previewed content.
 *
 * @returns `WrappedComponent` with automatic Prismic preview data.
 */
declare const withPrismicPreview: <TStaticData extends UnknownRecord<PropertyKey>, TProps extends gatsby.PageProps<TStaticData, object, unknown>>(WrappedComponent: React$1.ComponentType<TProps & WithPrismicPreviewProps<TStaticData>>, repositoryConfigs?: PrismicRepositoryConfigs, config?: WithPrismicPreviewConfig) => React$1.ComponentType<TProps>;

interface WithPrismicPreviewResolverProps {
    isPrismicPreview: boolean | null;
    prismicPreviewPath: PrismicContextState["resolvedPath"];
}
declare type WithPrismicPreviewResolverConfig = {
    autoRedirect?: boolean;
    navigate?: typeof gatsby.navigate;
    fetch?: FetchLike;
};
/**
 * A React higher order component (HOC) that wraps a Gatsby page to
 * automatically setup a Prismic preview resolver page. It can automatically
 * redirect an editor to the previewed document's page.
 *
 * @param WrappedComponent - The Gatsby page component.
 * @param usePrismicPreviewResolverConfig - Configuration determining how the
 *   preview session is resolved.
 * @param config - Configuration determining how the HOC handes the resolved preview.
 *
 * @returns `WrappedComponent` with automatic Prismic preview resolving.
 */
declare const withPrismicPreviewResolver: <TProps extends gatsby.PageProps<object, object, unknown>>(WrappedComponent: React$1.ComponentType<TProps & WithPrismicPreviewResolverProps>, repositoryConfigs?: PrismicRepositoryConfigs, config?: WithPrismicPreviewResolverConfig) => React$1.ComponentType<TProps>;

/**
 * A convenience function to create a `componentResolver` function from a record
 * mapping a Prismic document type to a React component.
 *
 * In most cases, this convenience function is sufficient to provide a working
 * unpublished preview experience.
 *
 * @param componentMap - A record mapping a Prismic document type to a React component.
 *
 * @returns A `componentResolver` function that can be passed to
 *   `withPrismicUnpublishedPreview`'s configuration.
 */
declare const componentResolverFromMap: (componentMap: Record<string, React$1.ComponentType<any>>) => PrismicUnpublishedRepositoryConfig["componentResolver"];
/**
 * A `dataResolver` function that assumes the first matching node for the page's
 * URL is the primary document. The document is added to the page's `data` prop
 * using the Prismic document's type formatted using Gatsby's camel-cased query
 * convention.
 */
declare const defaultDataResolver: PrismicUnpublishedRepositoryConfig["dataResolver"];
declare type WithPrismicUnpublishedPreviewConfig = {
    fetch?: FetchLike;
};
/**
 * A React higher order component (HOC) that wraps a Gatsby page to
 * automatically display a template for an unpublished Prismic document. This
 * HOC should be used on your app's 404 page (usually `src/pages/404.js`).
 *
 * @param WrappedComponent - The Gatsby page component.
 * @param usePrismicPreviewBootstrapConfig - Configuration determining how the
 *   preview session is managed.
 * @param config - Configuration determining how the HOC handes previewed content.
 *
 * @returns `WrappedComponent` with automatic unpublished Prismic preview data.
 */
declare const withPrismicUnpublishedPreview: <TStaticData extends UnknownRecord<PropertyKey>, TProps extends gatsby.PageProps<TStaticData, object, unknown>>(WrappedComponent: React$1.ComponentType<TProps>, repositoryConfigs?: PrismicUnpublishedRepositoryConfigs | undefined, config?: WithPrismicUnpublishedPreviewConfig) => React$1.ComponentType<TProps>;

export { FetchLike, FieldNameTransformer, PluginOptions, PrismicAPIDocumentNodeInput, PrismicContext, PrismicContextAction, PrismicContextActionType, PrismicContextState, PrismicContextValue, PrismicPreviewProvider, PrismicPreviewState, PrismicProviderProps, PrismicRepositoryConfig, PrismicRepositoryConfigs, PrismicUnpublishedRepositoryConfig, PrismicUnpublishedRepositoryConfigs, RequestInitLike, ResponseLike, SetAccessTokenFn, UnknownRecord, UsePrismicPreviewBootstrapConfig, UsePrismicPreviewBootstrapFn, UsePrismicPreviewDataConfig, UsePrismicPreviewDataResult, UsePrismicPreviewResolverConfig, UsePrismicPreviewResolverFn, WithPrismicPreviewConfig, WithPrismicPreviewProps, WithPrismicPreviewResolverConfig, WithPrismicPreviewResolverProps, WithPrismicUnpublishedPreviewConfig, WriteTypePathsToFilesystemArgs, componentResolverFromMap, contextReducer, defaultDataResolver, useMergePrismicPreviewData, usePrismicPreviewAccessToken, usePrismicPreviewBootstrap, usePrismicPreviewContext, usePrismicPreviewResolver, withPrismicPreview, withPrismicPreviewResolver, withPrismicUnpublishedPreview };
