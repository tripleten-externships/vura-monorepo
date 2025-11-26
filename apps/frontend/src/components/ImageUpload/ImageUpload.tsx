import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type {
  Asset,
  CameraOptions,
  ImageLibraryOptions,
  ImagePickerResponse,
} from 'react-native-image-picker';
import { useCamera } from '../../hooks/useCamera';
import { useImageLibrary } from '../../hooks/useImageLibrary';

export interface ImageUploadChangeEvent {
  asset: Asset | null;
  response: ImagePickerResponse | null;
  source: 'camera' | 'library';
}

interface ImageUploadProps {
  label?: string;
  helperText?: string;
  cameraOptions?: CameraOptions;
  libraryOptions?: ImageLibraryOptions;
  onChange?: (event: ImageUploadChangeEvent) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label = 'Upload image',
  helperText,
  cameraOptions,
  libraryOptions,
  onChange,
  disabled = false,
  placeholder = 'No image selected',
}) => {
  const [preview, setPreview] = useState<Asset | null>(null);

  const {
    openCamera,
    isCapturing,
    error: cameraError,
  } = useCamera({
    defaultOptions: cameraOptions,
  });

  const {
    openImageLibrary,
    isSelecting,
    error: libraryError,
  } = useImageLibrary({
    defaultOptions: libraryOptions,
  });

  const isBusy = isCapturing || isSelecting;
  const error = cameraError ?? libraryError;

  const handleChange = useCallback(
    (source: 'camera' | 'library', response: ImagePickerResponse | null) => {
      if (!response || response.didCancel) {
        return;
      }

      const asset = response.assets?.[0] ?? null;
      setPreview(asset);
      onChange?.({ asset, response, source });
    },
    [onChange]
  );

  const handleCameraPress = useCallback(async () => {
    try {
      const response = await openCamera();
      handleChange('camera', response);
    } catch {
      // errors are surfaced through the hook state
    }
  }, [handleChange, openCamera]);

  const handleLibraryPress = useCallback(async () => {
    try {
      const response = await openImageLibrary();
      handleChange('library', response);
    } catch {
      // errors are surfaced through the hook state
    }
  }, [handleChange, openImageLibrary]);

  const actionLabel = useMemo(() => {
    if (isCapturing) {
      return 'Opening camera...';
    }
    if (isSelecting) {
      return 'Opening library...';
    }
    return null;
  }, [isCapturing, isSelecting]);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {preview?.uri ? (
        <Image
          source={{ uri: preview.uri }}
          style={[styles.previewImage, styles.blockSpacing]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.placeholder, styles.blockSpacing]}>
          <Text style={styles.placeholderText}>{placeholder}</Text>
        </View>
      )}

      <View style={[styles.actions, styles.blockSpacing]}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonSpacing,
            disabled || isBusy ? styles.disabledButton : null,
          ]}
          onPress={handleCameraPress}
          disabled={disabled || isBusy}
        >
          <Text style={styles.buttonText}>Take photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, disabled || isBusy ? styles.disabledButton : null]}
          onPress={handleLibraryPress}
          disabled={disabled || isBusy}
        >
          <Text style={styles.buttonText}>Choose image</Text>
        </TouchableOpacity>
      </View>

      {helperText ? (
        <Text style={[styles.helperText, styles.blockSpacing]}>{helperText}</Text>
      ) : null}

      {isBusy ? (
        <View style={[styles.statusRow, styles.blockSpacing]}>
          <ActivityIndicator size="small" />
          {actionLabel ? <Text style={styles.statusText}>{actionLabel}</Text> : null}
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  blockSpacing: {
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  placeholder: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  placeholderText: {
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#363636',
    alignItems: 'center',
  },
  buttonSpacing: {
    marginRight: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  helperText: {
    color: '#666',
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#666',
    marginLeft: 8,
  },
  errorText: {
    color: '#b3261e',
    fontSize: 14,
  },
});
