import {
  DEFAULT_IMGIX_PARAMS,
  DEFAULT_LANG,
  DEFAULT_PLACEHOLDER_IMGIX_PARAMS,
} from '../../src/constants'
import { PluginOptions, PrismicSchema } from '../../src/types'
import kitchenSinkSchema from './kitchenSinkSchema.json'

export const pluginOptions: PluginOptions = {
  repositoryName: 'qwerty',
  accessToken: 'accessToken',
  apiEndpoint: 'https://qwerty.cdn.prismic.io/api/v2',
  typePrefix: 'prefix',
  schemas: {
    page: kitchenSinkSchema as PrismicSchema,
  },
  lang: DEFAULT_LANG,
  webhookSecret: 'secret',
  imageImgixParams: DEFAULT_IMGIX_PARAMS,
  imagePlaceholderImgixParams: DEFAULT_PLACEHOLDER_IMGIX_PARAMS,
  linkResolver: () => 'linkResolver',
  htmlSerializer: () => 'htmlSerializer',
  plugins: [],
}