import * as gatsby from 'gatsby'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as R from 'fp-ts/Record'
import * as S from 'fp-ts/Semigroup'
import { pipe } from 'fp-ts/function'

import {
  Dependencies,
  PrismicSchema,
  PrismicSchemaField,
  PrismicAPIDocumentNode,
  PrismicSpecialType,
} from '../types'
import {
  PREVIEWABLE_NODE_ID_FIELD,
  PRISMIC_API_NON_DATA_FIELDS,
} from '../constants'
import { getTypeName } from './getTypeName'
import { buildObjectType } from './buildObjectType'
import { createType } from './createType'
import { buildFieldConfigMap } from './buildFieldConfigMap'
import { createTypePath } from './createTypePath'

const collectFields = (
  schema: PrismicSchema,
): Record<string, PrismicSchemaField> =>
  pipe(
    schema,
    R.collect((_, value) => value),
    S.fold(S.getObjectSemigroup<Record<string, PrismicSchemaField>>())({}),
  )

export const createCustomType = (
  name: string,
  schema: PrismicSchema,
): RTE.ReaderTaskEither<Dependencies, never, gatsby.GatsbyGraphQLObjectType> =>
  pipe(
    RTE.ask<Dependencies>(),
    RTE.chain((deps) =>
      pipe(
        schema,
        collectFields,
        (record) => buildFieldConfigMap([name, 'data'], record),
        RTE.map(
          R.partitionWithIndex((i) => PRISMIC_API_NON_DATA_FIELDS.includes(i)),
        ),
        RTE.chainFirst(() =>
          createTypePath([name, 'data'], PrismicSpecialType.DocumentData),
        ),
        RTE.bind('data', (fields) =>
          pipe(
            buildObjectType({
              name: deps.nodeHelpers.createTypeName(name, 'DataType'),
              fields: fields.left,
            }),
            RTE.chainFirst(createType),
            RTE.map(getTypeName),
          ),
        ),
        RTE.chain((fields) =>
          buildObjectType({
            name: deps.nodeHelpers.createTypeName(name),
            fields: {
              ...fields.right,
              // Need to type cast the property name so TypeScript can
              // statically analize the object keys.
              [deps.nodeHelpers.createFieldName('id') as 'id']: 'ID!',
              data: fields.data,
              dataRaw: {
                type: 'JSON!',
                resolve: (source: PrismicAPIDocumentNode) => source.data,
              },
              first_publication_date: {
                type: 'Date!',
                extensions: { dateformat: {} },
              },
              href: 'String!',
              lang: 'String!',
              last_publication_date: {
                type: 'Date!',
                extensions: { dateformat: {} },
              },
              tags: '[String!]!',
              type: 'String!',
              url: {
                type: 'String',
                resolve: (source: PrismicAPIDocumentNode) =>
                  deps.pluginOptions.linkResolver?.(source),
              },
              [PREVIEWABLE_NODE_ID_FIELD]: {
                type: 'ID!',
                resolve: (source: PrismicAPIDocumentNode) =>
                  source[deps.nodeHelpers.createFieldName('id')],
              },
            },
            interfaces: ['Node'],
            extensions: { infer: false },
          }),
        ),
        RTE.chainFirst(createType),
        RTE.chainFirst(() =>
          createTypePath([name], PrismicSpecialType.Document),
        ),
      ),
    ),
  )