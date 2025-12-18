import { useCallback, useState } from 'react';
// import { Platform } from 'react-native';
import {
  ImageLibraryOptions,
  ImagePickerResponse,
  launchImageLibrary,
  MediaType,
} from 'react-native-image-picker';

interface UseImageLibraryConfig {
  defaultOptions?: ImageLibraryOptions;
  onSuccess?: (response: ImagePickerResponse) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_MEDIA_TYPE: MediaType = 'photo';

// TODO: decide if we want to support image library on web
// const unsupportedOnWebError = () =>
//   new Error('Image library access is not supported in the current environment.');

export const useImageLibrary = (config: UseImageLibraryConfig = {}) => {
  const { defaultOptions, onSuccess, onError } = config;
  const [isSelecting, setIsSelecting] = useState(false);
  const [response, setResponse] = useState<ImagePickerResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const openImageLibrary = useCallback(
    async (overrideOptions?: ImageLibraryOptions) => {
      // TODO: decide if we want to support image library on web
      //   if (Platform.OS === 'web') {
      //     const err = unsupportedOnWebError();
      //     setError(err);
      //     onError?.(err);
      //     throw err;
      //   }

      setIsSelecting(true);
      setError(null);

      const mergedOptions: ImageLibraryOptions = {
        mediaType: DEFAULT_MEDIA_TYPE,
        selectionLimit: 1,
        ...defaultOptions,
        ...overrideOptions,
      };

      try {
        const pickerResponse = await launchImageLibrary(mergedOptions);

        if (pickerResponse.errorCode) {
          throw new Error(pickerResponse.errorMessage ?? 'Failed to open image library.');
        }

        setResponse(pickerResponse);

        if (!pickerResponse.didCancel) {
          onSuccess?.(pickerResponse);
        }

        return pickerResponse;
      } catch (err) {
        const normalizedError =
          err instanceof Error ? err : new Error('Image selection failed unexpectedly.');

        setError(normalizedError);
        onError?.(normalizedError);
        throw normalizedError;
      } finally {
        setIsSelecting(false);
      }
    },
    [defaultOptions, onError, onSuccess]
  );

  return {
    openImageLibrary,
    response,
    asset: response?.assets?.[0] ?? null,
    isSelecting,
    error,
  } as const;
};
