import * as prismicT from '@prismicio/types'
import * as RTE from 'fp-ts/ReaderTaskEither'
import { pipe } from 'fp-ts/function'

import { createTypePath } from '../lib/createTypePath'

import { FieldConfigCreator, TypePathKind } from '../types'

/**
 * Builds a GraphQL field configuration object for a Number Custom Type field.
 * The resulting configuration object can be used in a GraphQL type.
 *
 * This function registers a typepath for the field.
 *
 * @param path Path to the field.
 *
 * @returns GraphQL field configuration object.
 */
export const buildNumberFieldConfig: FieldConfigCreator = (path) =>
  pipe(
    createTypePath(
      TypePathKind.Field,
      path,
      prismicT.CustomTypeModelFieldType.Number,
    ),
    RTE.map(() => 'Float'),
  )
