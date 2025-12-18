import { GraphQLError } from 'graphql';
import { Context } from '../../../types/context';
import {
  FrontendAuthProvider,
  FrontendAuthService,
  type FrontendAuthResult,
  type FrontendOAuthInput,
  type FrontendPasswordLoginInput,
  type FrontendPasswordSignupInput,
} from '../../../services/auth';
import { getEventBus } from '../../subscriptions/eventBus';

export interface FrontendSignupArgs {
  input: FrontendPasswordSignupInput;
}

export interface FrontendLoginArgs {
  input: FrontendPasswordLoginInput;
}

export interface CompleteOAuthArgs {
  input: FrontendOAuthInput & {
    provider: 'GOOGLE' | 'APPLE';
  };
}

const providerMap: Record<'GOOGLE' | 'APPLE', FrontendAuthProvider> = {
  GOOGLE: FrontendAuthProvider.GOOGLE,
  APPLE: FrontendAuthProvider.APPLE,
};

const getService = (context: Context) =>
  new FrontendAuthService({
    context,
    eventBus: getEventBus(),
  });

const toPayload = (result: FrontendAuthResult) => ({
  token: result.token,
  jwt: result.jwt,
  user: result.user,
});

const getBackendUrl = () => process.env.BACKEND_URL || 'http://localhost:3001';

export const registerFrontendUser = async (
  _: unknown,
  { input }: FrontendSignupArgs,
  context: Context
) => {
  const service = getService(context);
  const result = await service.registerWithPassword(input);
  return toPayload(result);
};

export const loginFrontendUser = async (
  _: unknown,
  { input }: FrontendLoginArgs,
  context: Context
) => {
  const service = getService(context);
  const result = await service.loginWithPassword(input);
  return toPayload(result);
};

export const beginGoogleAuth = () => ({
  url: `${getBackendUrl()}/auth/google`,
});

export const beginAppleAuth = () => ({
  url: `${getBackendUrl()}/auth/apple/native`,
});

export const completeOAuthCallback = async (
  _: unknown,
  { input }: CompleteOAuthArgs,
  context: Context
) => {
  const provider = providerMap[input.provider];
  if (!provider) {
    throw new GraphQLError('Unsupported OAuth provider', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const service = getService(context);
  const result = await service.upsertOAuthAccount(provider, input);
  return toPayload(result);
};
