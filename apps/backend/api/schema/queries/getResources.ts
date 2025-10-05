import { GraphQLError } from 'graphql';
import type { KeystoneContext } from '@keystone-6/core/types';
import { decodeCursor, encodeCursor } from '../../pagination/cursor';

const MIN_SEARCH_LENGTH = 2;

export const getResources = async (parent: any, { input }: any, context: KeystoneContext) => {
  try {
    // 1. Validate input
    const { first = 10, after, checklistId, searchTerm, orderBy = 'ID_ASC' } = input || {};

    if (first <= 0) throw new GraphQLError('Invalid pagination parameters');
    if (searchTerm && searchTerm.length < MIN_SEARCH_LENGTH)
      throw new GraphQLError('Search term must be at least 2 characters');

    // 2. Validate checklistId if provided
    if (checklistId) {
      const checklist = await context.db.Checklist.findOne({ where: { id: checklistId } });
      if (!checklist) throw new GraphQLError('Checklist not found');
    }

    // 3. Build filters
    const where: any = {};
    if (checklistId) where.checklist = { id: { equals: checklistId } };
    if (searchTerm) {
      where.OR = [
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { link: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // 4. Handle ordering
    let orderByObj: any = {};
    switch (orderBy) {
      case 'ID_ASC':
        orderByObj = { id: 'asc' };
        break;
      case 'ID_DESC':
        orderByObj = { id: 'desc' };
        break;
      case 'CONTENT_ASC':
        orderByObj = { content: 'asc' };
        break;
      case 'CONTENT_DESC':
        orderByObj = { content: 'desc' };
        break;
      default:
        throw new GraphQLError('Invalid order parameter');
    }

    // 5. Handle cursor
    let cursor = undefined;
    if (after) {
      try {
        cursor = decodeCursor(after);
      } catch {
        throw new GraphQLError('Invalid cursor');
      }
    }

    // 6. Query total count for pagination metadata
    const totalCount = await context.db.Resource.count({ where });

    // 7. Query resources with pagination
    const resources = await context.db.Resource.findMany({
      where,
      orderBy: orderByObj,
      take: first,
      ...(cursor ? { skip: 1, cursor } : {}),
    });

    // 8. Prepare edges and cursors
    const edges = resources.map((resource) => ({
      node: resource,
      cursor: encodeCursor({ id: resource.id }),
    }));

    // 9. PageInfo
    const hasNextPage = resources.length === first;
    const hasPreviousPage = !!after;
    const startCursor = edges[0]?.cursor || null;
    const endCursor = edges[edges.length - 1]?.cursor || null;

    return {
      edges,
      pageInfo: { hasNextPage, hasPreviousPage, startCursor, endCursor },
      totalCount,
    };
  } catch (err: any) {
    if (err instanceof GraphQLError) throw err;
    throw new GraphQLError('Failed to fetch resources');
  }
};
