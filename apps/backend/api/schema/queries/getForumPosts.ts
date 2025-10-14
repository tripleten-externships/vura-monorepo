import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';

// input type for forum post queries
export interface GetForumPostsInput {
  first?: number;
  after?: string;
  topic?: string;
  authorId?: string;
  searchTerm?: string;
  dateFrom?: Date;
  dateTo?: Date;
  orderBy?:
    | 'CREATED_AT_ASC'
    | 'CREATED_AT_DESC'
    | 'UPDATED_AT_ASC'
    | 'UPDATED_AT_DESC'
    | 'TITLE_ASC'
    | 'TITLE_DESC';
}

export const getForumPosts = async (
  _: any,
  { input }: { input?: GetForumPostsInput },
  context: Context
) => {
  try {
    // authorization
    if (!context.session?.data?.id) {
      throw new GraphQLError('User must be authenticated to view forum posts', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const {
      first = 10,
      after,
      topic,
      authorId,
      searchTerm,
      dateFrom,
      dateTo,
      orderBy = 'CREATED_AT_DESC',
    } = input || {};

    // validation
    if (first <= 0 || first > 50) {
      throw new GraphQLError('Invalid pagination parameters', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      throw new GraphQLError('Invalid date range', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    if (searchTerm && searchTerm.length < 3) {
      throw new GraphQLError('Search term must be at least 3 characters', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    if (authorId) {
      const authorExists = await context.db.User.findOne({ where: { id: authorId } });
      if (!authorExists) {
        throw new GraphQLError('Author not found', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    }

    // Decoding cursor
    let cursorId: string | undefined;
    if (after) {
      try {
        cursorId = Buffer.from(after, 'base64').toString('utf-8');
      } catch {
        throw new GraphQLError('Invalid cursor', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
    }

    // building filters
    const filters: any = {};
    if (topic) filters.topic = { equals: topic };
    if (authorId) filters.author = { id: { equals: authorId } };
    if (searchTerm) {
      filters.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    if (dateFrom || dateTo) {
      filters.createdAt = {};
      if (dateFrom) filters.createdAt.gte = dateFrom;
      if (dateTo) filters.createdAt.lte = dateTo;
    }

    // Fetching Posts
    const posts = await context.db.ForumPost.findMany({
      where: filters,
      take: first,
      skip: after ? 1 : 0,
      ...(cursorId && { cursor: { id: cursorId } }),
      orderBy: (() => {
        const [field, dir] = orderBy.toLowerCase().split('_');
        const direction = dir === 'asc' ? 'asc' : 'desc';
        return { [field]: direction as 'asc' | 'desc' };
      })(),
    });

    const totalCount = await context.db.ForumPost.count({ where: filters });

    const edges = posts.map((post: any) => ({
      node: post,
      cursor: Buffer.from(post.id).toString('base64'),
    }));

    const pageInfo = {
      hasNextPage: posts.length === first,
      hasPreviousPage: !!after,
      startCursor: edges.length ? edges[0].cursor : null,
      endCursor: edges.length ? edges[edges.length - 1].cursor : null,
    };

    return { edges, pageInfo, totalCount };
  } catch (error: any) {
    console.error('Error fetching forum posts:', error);
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new GraphQLError(error.message || 'Failed to fetch forum posts', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
};
