import test from 'ava'
import * as msw from 'msw'
import * as mswNode from 'msw/node'
import * as gatsbyPrismic from 'gatsby-source-prismic'
import * as prismic from 'ts-prismic'
import * as cookie from 'es-cookie'
import { renderHook, act } from '@testing-library/react-hooks'
import { createNodeHelpers } from 'gatsby-node-helpers'
import md5 from 'tiny-hashes/md5'
import browserEnv from 'browser-env'

import { clearAllCookies } from './__testutils__/clearAllCookies'
import { createGatsbyContext } from './__testutils__/createGatsbyContext'
import { createPluginOptions } from './__testutils__/createPluginOptions'
import { createPreviewToken } from './__testutils__/createPreviewToken'
import { createPrismicAPIQueryResponse } from './__testutils__/createPrismicAPIQueryResponse'
import { polyfillKy } from './__testutils__/polyfillKy'
import { resolveURL } from './__testutils__/resolveURL'

import {
  PrismicAPIDocumentNodeInput,
  PrismicPreviewProvider,
  UsePrismicPreviewBootstrapConfig,
  usePrismicPreviewBootstrap,
  usePrismicPreviewContext,
} from '../src'
import { onClientEntry } from '../src/gatsby-browser'

const createConfig = (): UsePrismicPreviewBootstrapConfig => ({
  linkResolver: (doc): string => `/${doc.uid}`,
})

const nodeHelpers = createNodeHelpers({
  typePrefix: 'Prismic prefix',
  fieldPrefix: 'Prismic',
  createNodeId: (id) => md5(id),
  createContentDigest: (input) => md5(JSON.stringify(input)),
})

const server = mswNode.setupServer()
test.before(() => {
  polyfillKy()

  server.listen({ onUnhandledRequest: 'error' })

  browserEnv(['window', 'document'])

  globalThis.__PATH_PREFIX__ = 'https://example.com'
})
test.beforeEach(() => {
  clearAllCookies()
})
test.after(() => {
  server.close()
})

test.serial('initial state', async (t) => {
  const gatsbyContext = createGatsbyContext()
  const pluginOptions = createPluginOptions()
  const config = createConfig()

  // @ts-expect-error - Partial gatsbyContext provided
  await onClientEntry(gatsbyContext, pluginOptions)
  const { result } = renderHook(
    () => usePrismicPreviewBootstrap(pluginOptions.repositoryName, config),
    { wrapper: PrismicPreviewProvider },
  )
  const state = result.current[0]

  t.true(state.state === 'INIT')
  t.true(state.error === undefined)
})

test.serial('fails if not a preview session - cookie is not set', async (t) => {
  const gatsbyContext = createGatsbyContext()
  const pluginOptions = createPluginOptions()
  const config = createConfig()

  // @ts-expect-error - Partial gatsbyContext provided
  await onClientEntry(gatsbyContext, pluginOptions)
  const { result, waitForNextUpdate } = renderHook(
    () => usePrismicPreviewBootstrap(pluginOptions.repositoryName, config),
    { wrapper: PrismicPreviewProvider },
  )
  const bootstrapPreview = result.current[1]

  act(() => {
    bootstrapPreview()
  })

  await waitForNextUpdate()

  const state = result.current[0]

  t.true(state.state === 'FAILED')
  t.true(
    state.error?.message &&
      /preview cookie not present/i.test(state.error.message),
  )
})

test.serial('fails if not for this repository', async (t) => {
  const gatsbyContext = createGatsbyContext()
  const pluginOptions = createPluginOptions()
  const config = createConfig()

  const token = createPreviewToken('not-this-repository')
  cookie.set(prismic.cookie.preview, token)

  // @ts-expect-error - Partial gatsbyContext provided
  await onClientEntry(gatsbyContext, pluginOptions)
  const { result, waitForNextUpdate } = renderHook(
    () => usePrismicPreviewBootstrap(pluginOptions.repositoryName, config),
    { wrapper: PrismicPreviewProvider },
  )
  const bootstrapPreview = result.current[1]

  act(() => {
    bootstrapPreview()
  })

  await waitForNextUpdate()

  const state = result.current[0]

  t.true(state.state === 'FAILED')
  t.true(
    state.error?.message &&
      /token is not for this repository/i.test(state.error.message),
  )
})

test.serial(
  'fetches all repository documents and bootstraps context',
  async (t) => {
    const gatsbyContext = createGatsbyContext()
    const pluginOptions = createPluginOptions()
    const queryResponsePage1 = createPrismicAPIQueryResponse(undefined, {
      page: 1,
      total_pages: 2,
    })
    const queryResponsePage2 = createPrismicAPIQueryResponse(undefined, {
      page: 2,
      total_pages: 2,
    })
    const config = createConfig()

    const token = createPreviewToken(pluginOptions.repositoryName)
    cookie.set(prismic.cookie.preview, token)

    const queryResponsePage1Nodes = queryResponsePage1.results.map((doc) => {
      const node = nodeHelpers.createNodeFactory(doc.type)(
        doc,
      ) as PrismicAPIDocumentNodeInput

      return {
        ...node,
        url: config.linkResolver(doc),
      }
    })

    const queryResponsePage2Nodes = queryResponsePage2.results.map((doc) => {
      const node = nodeHelpers.createNodeFactory(doc.type)(
        doc,
      ) as PrismicAPIDocumentNodeInput

      return {
        ...node,
        url: config.linkResolver(doc),
      }
    })

    // We're testing pagination functionality here. We need to make sure the hook
    // will fetch all documents in a repository, not just the first page of
    // results.

    server.use(
      msw.rest.get(
        resolveURL(pluginOptions.apiEndpoint, './documents/search'),
        (req, res, ctx) => {
          if (
            req.url.searchParams.get('access_token') ===
              pluginOptions.accessToken &&
            req.url.searchParams.get('ref') === token &&
            req.url.searchParams.get('lang') === pluginOptions.lang &&
            req.url.searchParams.get('graphQuery') ===
              pluginOptions.graphQuery &&
            req.url.searchParams.get('pageSize') === '100'
          ) {
            switch (req.url.searchParams.get('page')) {
              case '1':
                return res(ctx.json(queryResponsePage1))
              case '2':
                return res(ctx.json(queryResponsePage2))
              default:
                return res(ctx.status(401))
            }
          } else {
            return res(ctx.status(401))
          }
        },
      ),
    )

    server.use(
      msw.rest.get(
        resolveURL(
          globalThis.__PATH_PREFIX__,
          '/static/9e387d94c04ebf0e369948edd9c66d2b.json',
        ),
        (_req, res, ctx) =>
          res(
            ctx.json({
              type: gatsbyPrismic.PrismicSpecialType.Document,
              'type.data': gatsbyPrismic.PrismicSpecialType.DocumentData,
            }),
          ),
      ),
    )

    // @ts-expect-error - Partial gatsbyContext provided
    await onClientEntry(gatsbyContext, pluginOptions)
    const { result, waitForValueToChange } = renderHook(
      () => {
        const context = usePrismicPreviewContext(pluginOptions.repositoryName)
        const bootstrap = usePrismicPreviewBootstrap(
          pluginOptions.repositoryName,
          config,
        )

        return { bootstrap, context }
      },
      { wrapper: PrismicPreviewProvider },
    )
    const bootstrapPreview = result.current.bootstrap[1]

    t.true(result.current.bootstrap[0].state === 'INIT')

    act(() => {
      bootstrapPreview()
    })

    await waitForValueToChange(() => result.current.bootstrap[0].state)
    t.true(result.current.bootstrap[0].state === 'BOOTSTRAPPING')

    await waitForValueToChange(() => result.current.bootstrap[0].state)
    t.true(result.current.bootstrap[0].state === 'BOOTSTRAPPED')
    t.true(result.current.bootstrap[0].error === undefined)
    t.true(result.current.context[0].isBootstrapped)
    t.deepEqual(result.current.context[0].nodes, {
      [queryResponsePage1Nodes[0].prismicId]: queryResponsePage1Nodes[0],
      [queryResponsePage1Nodes[1].prismicId]: queryResponsePage1Nodes[1],
      [queryResponsePage2Nodes[0].prismicId]: queryResponsePage2Nodes[0],
      [queryResponsePage2Nodes[1].prismicId]: queryResponsePage2Nodes[1],
    })
  },
)

test.serial('fails if already bootstrapped', async (t) => {
  const gatsbyContext = createGatsbyContext()
  const pluginOptions = createPluginOptions()
  const queryResponsePage1 = createPrismicAPIQueryResponse(undefined, {
    page: 1,
    total_pages: 2,
  })
  const queryResponsePage2 = createPrismicAPIQueryResponse(undefined, {
    page: 2,
    total_pages: 2,
  })
  const config = createConfig()

  const token = createPreviewToken(pluginOptions.repositoryName)
  cookie.set(prismic.cookie.preview, token)

  // We're testing pagination functionality here. We need to make sure the hook
  // will fetch all documents in a repository, not just the first page of
  // results.

  server.use(
    msw.rest.get(
      resolveURL(pluginOptions.apiEndpoint, './documents/search'),
      (req, res, ctx) => {
        if (
          req.url.searchParams.get('access_token') ===
            pluginOptions.accessToken &&
          req.url.searchParams.get('ref') === token &&
          req.url.searchParams.get('lang') === pluginOptions.lang &&
          req.url.searchParams.get('graphQuery') === pluginOptions.graphQuery &&
          req.url.searchParams.get('pageSize') === '100'
        ) {
          switch (req.url.searchParams.get('page')) {
            case '1':
              return res(ctx.json(queryResponsePage1))
            case '2':
              return res(ctx.json(queryResponsePage2))
            default:
              return res(ctx.status(401))
          }
        } else {
          return res(ctx.status(401))
        }
      },
    ),
  )

  server.use(
    msw.rest.get(
      resolveURL(
        globalThis.__PATH_PREFIX__,
        '/static/9e387d94c04ebf0e369948edd9c66d2b.json',
      ),
      (_req, res, ctx) =>
        res(
          ctx.json({
            type: gatsbyPrismic.PrismicSpecialType.Document,
            'type.data': gatsbyPrismic.PrismicSpecialType.DocumentData,
          }),
        ),
    ),
  )

  // @ts-expect-error - Partial gatsbyContext provided
  await onClientEntry(gatsbyContext, pluginOptions)
  const { result, waitForValueToChange } = renderHook(
    () => {
      const context = usePrismicPreviewContext(pluginOptions.repositoryName)
      const bootstrap = usePrismicPreviewBootstrap(
        pluginOptions.repositoryName,
        config,
      )

      return { bootstrap, context }
    },
    { wrapper: PrismicPreviewProvider },
  )

  t.true(result.current.bootstrap[0].state === 'INIT')

  // Bootstrap the first time.
  act(() => {
    result.current.bootstrap[1]()
  })

  await waitForValueToChange(() => result.current.bootstrap[0].state)
  t.true(result.current.bootstrap[0].state === 'BOOTSTRAPPING')

  await waitForValueToChange(() => result.current.bootstrap[0].state)
  t.true(result.current.bootstrap[0].state === 'BOOTSTRAPPED')
  t.true(result.current.bootstrap[0].error === undefined)

  // Bootstrap the second time.
  act(() => {
    result.current.bootstrap[1]()
  })

  await waitForValueToChange(() => result.current.bootstrap[0].state)
  t.true(result.current.bootstrap[0].state === 'FAILED')
  t.true(
    result.current.bootstrap[0].error?.message &&
      /already been bootstrapped/i.test(
        result.current.bootstrap[0].error.message,
      ),
  )
})