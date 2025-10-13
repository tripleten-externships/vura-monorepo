// import { graphql } from '@keystone-6/core';

export const getForumPosts = {
  // Matches query
  async resolve(_: any, { input }: any, context: any) {
    try {
      // authorization
      if (!context.session?.itemId) {
        throw new Error('User must be authenticated to view forum posts');
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
      if (first <= 0 || first > 50) throw new Error('Invalid pagination parameters');
      if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo))
        throw new Error('Invalid date range');
      if (searchTerm && searchTerm.length < 3)
        throw new Error('Search term must be at least 3 characters');
      if (authorId) {
        const authorExists = await context.db.User.findOne({ where: { id: authorId } });
        if (!authorExists) throw new Error('Author not found');
      }

      // Decoding cursor
      let cursorId: string | undefined;
      if (after) {
        try {
          cursorId = Buffer.from(after, 'base64').toString('utf-8');
        } catch {
          throw new Error('Invalid cursor');
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
          const [field, direction] = orderBy.toLowerCase().split('_');
          return { [field]: direction };
        })(),
      });

      const totalCount = await context.db.ForumPost.count({ where: filters });

      const edges = posts.map((post) => ({
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
      throw new Error(error.message || 'Failed to fetch forum posts');
    }
  },
};
