import { makeObservable, observable, action } from 'mobx';
import type { RootStore } from './rootStore';
import { BaseStore } from './baseStore';
import { GET_RESOURCES } from '../graphql/queries/resources';
import type { GetResourcesInput, GetResourcesQuery } from '../__generated__/graphql';

type ResourceNode = GetResourcesQuery['getResources']['edges'][number]['node'];

export class ResourceStore extends BaseStore {
  resources: ResourceNode[] = [];
  loading = false;
  error?: string;

  constructor(rootStore: RootStore) {
    super(rootStore);
    makeObservable(this, {
      resources: observable,
      loading: observable,
      error: observable,
      fetchResources: action,
      reset: action,
    });
  }

  async fetchResources(input?: GetResourcesInput) {
    this.loading = true;
    try {
      await this.executeQuery<GetResourcesQuery, { input?: GetResourcesInput }>(
        GET_RESOURCES,
        { input },
        (data) => {
          this.resources = data.getResources.edges.map((edge) => edge.node);
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
    this.resources = [];
    this.loading = false;
    this.error = undefined;
  }
}
