# Migrating from `gatsby-source-prismic`

## Handling breaking changes

### Update `withPreview` to `withPrismicPreview`

In your preview-enabled page components or templates, update the `withPreview()`
import to the `withPrismicPreview()` import and provide additional arguments to
the function as described below.

```diff
- import { withPreview } from 'gatsby-source-prismic'
+ import { withPrismicPreview } from 'gatsby-plugin-prismic-previews'
  import { linkResolver } from '../linkResolver'

  const Page = ({ data }) => {
    // Your Page component
  }

- export default withPreview(Page)
+ export default withPrismicPreview(Page, {
+   'your-repository-name': { linkResolver }
+ })
```

In most cases, you will need to add your repository name, Link Resolver, and, if
used, HTML Serializer, to the `withPrismicPreview()` function.

See the [`withPrismicPreview()`](./api-withPrismicPreview.md) documentation for
more details.

### Update `withPreviewResolver` to `withPrismicPreviewResolver`

In your dedicated preview resolver page, update the `withPreviewResolver` import
to the `withPrismicPreviewResolver` import and update the arguments provided to
the function as described below. The preview resolver page is typically created
at `/src/pages/preview.js`.

```diff
- import { withPreviewResolver } from 'gatsby-source-prismic'
+ import { withPrismicPreviewResolver } from 'gatsby-plugin-prismic-previews'
  import { linkResolver } from '../linkResolver'

  const PreviewPage = ({ data }) => {
    // Your Page component
  }

- export default withPreviewResolver(PreviewPage, {
-   repositoryName: 'your-repository-name',
-   linkResolver,
- })
+ export default withPrismicPreviewResolver(Page, {
+   'your-repository-name': { linkResolver }
+ })
```

In most cases, you will only need to move your repository name to the function's
second argument.

See the [`withPrismicPreviewResolver()`](./api-withPrismicPreviewResolver.md)
documentation for more details.

### Update `withUnpublishedPreview` to `withPrismicUnpublishedPreview`

> TODO

In your dedicated preview page, update the `withUnpublishedPreview` import to
the `withPrismicUnpublishedPreview` import and update the arguments provided to
the function as described below. The unpublished preview page is typically
created as part of the "Not Found" 404 page at `/src/pages/404.js`.