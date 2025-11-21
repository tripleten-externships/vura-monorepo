import { makeObservable, observable, action } from 'mobx';
import type { RootStore } from './rootStore';
import { BaseStore } from './baseStore';
import { AI_CHAT_MUTATION } from '../graphql/mutations/ai';
import type { AiChatInput, AiChatMutation } from '../__generated__/graphql';

export class AiStore extends BaseStore {
  lastResponse: AiChatMutation['aiChat'] | null = null;
  sending = false;
  error?: string;

  constructor(rootStore: RootStore) {
    super(rootStore);
    makeObservable(this, {
      lastResponse: observable,
      sending: observable,
      error: observable,
      sendMessage: action,
      reset: action,
    });
  }

  async sendMessage(input: AiChatInput) {
    this.sending = true;
    this.error = undefined;

    try {
      await this.executeMutation<AiChatMutation, { input: AiChatInput }>(
        AI_CHAT_MUTATION,
        { input },
        (data) => {
          this.lastResponse = data.aiChat;
        },
        (err) => {
          this.error = err.message;
        }
      );
    } finally {
      this.sending = false;
    }
  }

  reset(): void {
    this.lastResponse = null;
    this.sending = false;
    this.error = undefined;
  }
}
