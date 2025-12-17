import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';

interface QuestionnaireTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  title?: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  errorMessage?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  returnKeyType?: 'done' | 'next' | 'send' | 'search' | 'go';
  onSubmitEditing?: () => void;
  showCharacterCount?: boolean;
  minHeight?: number;
  maxHeight?: number;
}

export const QuestionnaireTextInput: React.FC<QuestionnaireTextInputProps> = ({
  value,
  onChangeText,
  title,
  placeholder = 'Type your answer here...',
  multiline = true,
  maxLength = 500,
  errorMessage,
  disabled = false,
  autoFocus = false,
  keyboardType = 'default',
  returnKeyType = 'done',
  onSubmitEditing,
  showCharacterCount = false,
  minHeight = 120,
  maxHeight = 200,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(minHeight);
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);

    // Scroll to input when focused (for better UX on smaller screens)
    setTimeout(() => {
      if (scrollViewRef.current && textInputRef.current) {
        textInputRef.current.measureInWindow((x, y, width, height) => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, y - 100),
            animated: true,
          });
        });
      }
    }, 100);
  }, []);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Handle text change
  const handleTextChange = useCallback(
    (text: string) => {
      // Limit text length if maxLength is set
      const trimmedText = maxLength ? text.slice(0, maxLength) : text;
      onChangeText(trimmedText);
    },
    [onChangeText, maxLength]
  );

  // Handle content size change for auto-sizing
  const handleContentSizeChange = useCallback(
    (event: any) => {
      if (multiline) {
        const newHeight = Math.max(
          minHeight,
          Math.min(maxHeight, event.nativeEvent.contentSize.height)
        );
        setContentHeight(newHeight);
      }
    },
    [multiline, minHeight, maxHeight]
  );

  // Handle container press to focus input
  const handleContainerPress = useCallback(() => {
    if (!disabled) {
      textInputRef.current?.focus();
    }
  }, [disabled]);

  // Clear text
  const handleClear = useCallback(() => {
    onChangeText('');
    textInputRef.current?.focus();
  }, [onChangeText]);

  // Handle keyboard dismiss
  const handleKeyboardDismiss = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const characterCount = value.length;
  const isNearLimit = maxLength && characterCount > maxLength * 0.8;
  const isAtLimit = maxLength && characterCount >= maxLength;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {title && <Text style={styles.title}>{title}</Text>}

          <View
            style={[
              styles.inputContainer,
              isFocused && styles.inputContainerFocused,
              errorMessage && styles.inputContainerError,
              disabled && styles.inputContainerDisabled,
            ]}
          >
            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                multiline && { height: contentHeight },
                disabled && styles.textInputDisabled,
                Platform.OS === 'web' && ({ outline: 'none' } as any),
              ]}
              value={value}
              onChangeText={handleTextChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onContentSizeChange={handleContentSizeChange}
              onSubmitEditing={onSubmitEditing}
              placeholder={placeholder}
              placeholderTextColor="#999999"
              multiline={multiline}
              maxLength={maxLength}
              keyboardType={keyboardType}
              returnKeyType={returnKeyType}
              autoFocus={autoFocus}
              editable={!disabled}
              textAlignVertical="center"
              blurOnSubmit={!multiline}
              accessibilityLabel={title || placeholder}
              accessibilityHint={errorMessage || undefined}
            />

            {/* Clear button */}
            {value.length > 0 && isFocused && !disabled && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
                accessibilityRole="button"
                accessibilityLabel="Clear text"
              >
                <Text style={styles.clearButtonText}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Character count and error message row */}
          <View style={styles.bottomRow}>
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : (
              <View style={styles.spacer} />
            )}

            {showCharacterCount && maxLength && (
              <Text
                style={[
                  styles.characterCount,
                  isNearLimit ? styles.characterCountWarning : null,
                  isAtLimit ? styles.characterCountError : null,
                ]}
              >
                {characterCount}/{maxLength}
              </Text>
            )}
          </View>

          {/* Keyboard dismiss button for better UX */}
          {isFocused && (
            <TouchableOpacity
              style={styles.keyboardDismissButton}
              onPress={handleKeyboardDismiss}
              accessibilityRole="button"
              accessibilityLabel="Dismiss keyboard"
            >
              <Text style={styles.keyboardDismissText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '400',
    color: '#363636',
    marginBottom: 40,
    textAlign: 'center',
    fontFamily: 'Noto Serif',
    lineHeight: 44,
    letterSpacing: -0.34,
  },
  inputContainer: {
    borderWidth: 2,
    borderColor: '#E7E7E7',
    borderRadius: 28,
    backgroundColor: '#F6F4FA',
    position: 'relative',
    minHeight: 111,
  },
  inputContainerFocused: {
    borderColor: '#E7E7E7',
  },
  inputContainerError: {
    borderColor: '#FF4444',
  },
  inputContainerDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  textInput: {
    fontSize: 18,
    color: '#363636',
    padding: 16,
    textAlign: 'center',
    lineHeight: 21.6,
    fontFamily: 'Inter',
    fontWeight: '500',
    minHeight: 111,
    textAlignVertical: 'center',
  },
  textInputDisabled: {
    color: '#999999',
  },
  clearButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    minHeight: 20,
  },
  spacer: {
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    color: '#FF4444',
    flex: 1,
  },
  characterCount: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'right',
  },
  characterCountWarning: {
    color: '#FF8800',
  },
  characterCountError: {
    color: '#FF4444',
    fontWeight: '600',
  },
  keyboardDismissButton: {
    backgroundColor: '#363636',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
    marginTop: 16,
  },
  keyboardDismissText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuestionnaireTextInput;
