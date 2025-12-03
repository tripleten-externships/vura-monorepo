import { useCallback, useState } from 'react';
// import { Platform } from 'react-native';
import {
  CameraOptions,
  ImagePickerResponse,
  launchCamera,
  MediaType,
} from 'react-native-image-picker';

interface UseCameraConfig {
  defaultOptions?: CameraOptions;
  onSuccess?: (response: ImagePickerResponse) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_MEDIA_TYPE: MediaType = 'photo';

// TODO: decide if we want to support camera on web
// const unsupportedOnWebError = () =>
//   new Error('Camera access is not supported in the current environment.');

export const useCamera = (config: UseCameraConfig = {}) => {
  const { defaultOptions, onSuccess, onError } = config;
  const [isCapturing, setIsCapturing] = useState(false);
  const [response, setResponse] = useState<ImagePickerResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const openCamera = useCallback(
    async (overrideOptions?: CameraOptions) => {
      // TODO: decide if we want to support camera on web
      //   if (Platform.OS === 'web') {
      //     const err = unsupportedOnWebError();
      //     setError(err);
      //     onError?.(err);
      //     throw err;
      //   }

      setIsCapturing(true);
      setError(null);

      const mergedOptions: CameraOptions = {
        mediaType: DEFAULT_MEDIA_TYPE,
        saveToPhotos: false,
        cameraType: 'back',
        ...defaultOptions,
        ...overrideOptions,
      };

      try {
        const pickerResponse = await launchCamera(mergedOptions);

        if (pickerResponse.errorCode) {
          throw new Error(pickerResponse.errorMessage ?? 'Failed to launch camera.');
        }

        setResponse(pickerResponse);

        if (!pickerResponse.didCancel) {
          onSuccess?.(pickerResponse);
        }

        return pickerResponse;
      } catch (err) {
        const normalizedError =
          err instanceof Error ? err : new Error('Camera capture failed unexpectedly.');

        setError(normalizedError);
        onError?.(normalizedError);
        throw normalizedError;
      } finally {
        setIsCapturing(false);
      }
    },
    [defaultOptions, onError, onSuccess]
  );

  return {
    openCamera,
    response,
    asset: response?.assets?.[0] ?? null,
    isCapturing,
    error,
  } as const;
};
