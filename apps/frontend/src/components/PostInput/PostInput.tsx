import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Text, ColorValue } from 'react-native';

export interface PostInputProps {
  titlePlaceholder: string;
  bodyPlaceholder: string;
  onTitleChange?: (text: string) => void;
  onBodyChange?: (text: string) => void;
  placeholderTextColor: ColorValue;
}

export const PostInput = ({
  titlePlaceholder,
  bodyPlaceholder,
  onTitleChange,
  onBodyChange,
  placeholderTextColor,
}: PostInputProps) => {
  // use useState to store and update the title and body of the post
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // update the title and notify the parent component
  const handleTitleChange = (text: string) => {
    setTitle(text);
    onTitleChange?.(text);
  };

  // update the body and notify the parent component
  const handleBodyChange = (text: string) => {
    setBody(text);
    onBodyChange?.(text);
  };

  // TextInput fields for the post's title and body
  return (
    <View style={styles.container}>
      <Text style={styles.header}>New Post</Text>
      <TextInput
        style={styles.postTitle}
        value={title}
        onChangeText={handleTitleChange}
        placeholder={titlePlaceholder}
        placeholderTextColor={placeholderTextColor}
      />
      <TextInput
        style={styles.postBody}
        value={body}
        onChangeText={handleBodyChange}
        placeholder={bodyPlaceholder}
        placeholderTextColor={placeholderTextColor}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderColor: '#ffffff',
    paddingVertical: 22,
    paddingHorizontal: 24,
  },
  header: {
    fontSize: 16,
    fontWeight: 500,
    textAlign: 'center',
    color: '#363636',
  },
  postTitle: {
    fontSize: 24,
    fontWeight: 500,
    color: '#363636',
    marginBottom: 8,
    marginTop: 20,
  },
  postBody: {
    fontSize: 16,
    fontWeight: 400,
    color: '#363636',
    minHeight: 300,
  },
});
