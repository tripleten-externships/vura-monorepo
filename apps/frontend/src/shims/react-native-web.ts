import * as ReactNativeWeb from 'react-native-web';

export * from 'react-native-web';

type TurboModule = Record<string, unknown>;

const warn = () => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('TurboModuleRegistry is not available on web; returning a no-op module.');
  }
};

const fallbackModule: TurboModule = {
  getConstants: () => ({}),
};

export const TurboModuleRegistry = {
  get: (): TurboModule | null => {
    warn();
    return fallbackModule;
  },
  getEnforcing: (): TurboModule => {
    warn();
    return fallbackModule;
  },
};

export default ReactNativeWeb;
