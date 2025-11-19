import { makeObservable, observable, action } from 'mobx';
import type { RootStore } from './rootStore';
import { BaseStore } from './baseStore';
import { GET_FORUM_POSTS } from '../graphql/queries/forum';
import type { GetForumPostsInput, GetForumPostsQuery } from '../__generated__/graphql';

type ForumPostNode = GetForumPostsQuery['getForumPosts']['edges'][number]['node'];

export class ForumStore extends BaseStore {
  posts: ForumPostNode[] = [];
  loading = false;
  error?: string;

  constructor(rootStore: RootStore) {
    super(rootStore);
    makeObservable(this, {
      posts: observable,
      loading: observable,
      error: observable,
      fetchPosts: action,
      reset: action,
    });
  }

  async fetchPosts(input?: GetForumPostsInput) {
    this.loading = true;
    try {
      await this.executeQuery<GetForumPostsQuery, { input?: GetForumPostsInput }>(
        GET_FORUM_POSTS,
        { input },
        (data) => {
          this.posts = data.getForumPosts.edges.map((edge) => edge.node);
          this.error = undefined;
        },
        (err) => {
          this.error = err.message;
        }
      );
    } finally {
      this.loading = false;
    }
  }

  reset(): void {
    this.posts = [];
    this.loading = false;
    this.error = undefined;
  }
}
