import * as gatsby from 'gatsby'
import * as prismic from 'ts-prismic'
import {
  DEFAULT_IMGIX_PARAMS,
  DEFAULT_LANG,
  DEFAULT_PLACEHOLDER_IMGIX_PARAMS,
} from 'gatsby-source-prismic'

import { DEFAULT_PROMPT_FOR_ACCESS_TOKEN, DEFAULT_TOOLBAR } from './constants'

export const pluginOptionsSchema: NonNullable<
  gatsby.GatsbyNode['pluginOptionsSchema']
> = function (args) {
  const { Joi } = args

  const schema = Joi.object({
    repositoryName: Joi.string().required(),
    accessToken: Joi.string(),
    promptForAccessToken: Joi.boolean().default(
      DEFAULT_PROMPT_FOR_ACCESS_TOKEN,
    ),
    apiEndpoint: Joi.string().default((parent) =>
      prismic.defaultEndpoint(parent.repositoryName),
    ),
    graphQuery: Joi.string(),
    fetchLinks: Joi.array().items(Joi.string().required()),
    lang: Joi.string().default(DEFAULT_LANG),
    imageImgixParams: Joi.object().default(DEFAULT_IMGIX_PARAMS),
    imagePlaceholderImgixParams: Joi.object().default(
      DEFAULT_PLACEHOLDER_IMGIX_PARAMS,
    ),
    typePrefix: Joi.string(),
    toolbar: Joi.string().valid('new', 'legacy').default(DEFAULT_TOOLBAR),
  }).oxor('fetchLinks', 'graphQuery')

  return schema
}
