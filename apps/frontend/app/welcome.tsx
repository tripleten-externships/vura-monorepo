import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import { router } from 'expo-router';
import { InputField } from '../src/components/InputField/InputField';
// import { PostInput } from '../src/components/PostInput/PostInput';
// import { Emoji } from '../src/components/Emoji/Emoji';
// import { Bell } from '../src/components/Notification_bell/NotificationBell';

export default function WelcomePage() {
  const handleLogin = () => {
    // navigate to login page or show login modal
    console.log('Login pressed');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Vura by Betterhunt</Text>
      <Text style={styles.subtitle}>Please log in to continue</Text>

      {/* I added a temporary input field to test the component.*/}
      <InputField
        placeholder="Email"
        placeholderTextColor="rgba(54,54,54,0.5)"
        containerStyle={{
          borderColor: '#e7e7e7',
          paddingHorizontal: 20,
          marginTop: 20,
          width: 345,
          backgroundColor: '#f6f4fa',
        }}
      />
      <InputField
        placeholder="Password"
        placeholderTextColor="rgba(54,54,54,0.5)"
        secureTextEntry
        containerStyle={{
          borderColor: '#e7e7e7',
          paddingHorizontal: 20,
          marginTop: 20,
          width: 345,
          backgroundColor: '#f6f4fa',
        }}
      />
      <InputField
        placeholderTextColor="rgba(54,54,54,0.5)"
        placeholder="Ask AI helper, any question"
        svgIcon={{ uri: '../../assets/arrow_right.png' }}
        containerStyle={{
          borderColor: '#e7e7e7',
          height: 62,
          paddingHorizontal: 16,
          marginTop: 20,
          width: 345,
          backgroundColor: '#ffffff',
        }}
        iconStyle={{ width: 32, height: 32, marginTop: -4 }}
      />
      <InputField
        placeholderTextColor="rgba(54,54,54,0.5)"
        placeholder="Type your answer"
        svgIcon={{ uri: '../../assets/Send.png' }}
        containerStyle={{
          borderColor: '#e7e7e7',
          height: 62,
          paddingHorizontal: 16,
          marginTop: 20,
          width: 345,
          backgroundColor: '#ffffff',
        }}
        iconStyle={{ width: 24, height: 24 }}
      />
      {/* I added a post input field to test the component.
      <PostInput
        placeholderTextColor="rgba(54,54,54,0.5)"
        titlePlaceholder="Post title"
        bodyPlaceholder="Post text"
      /> */}
      {/* test emoji component
       <Emoji emojiIcon={{ uri: '../../assets/smile.svg' }} /> */}
      {/* test bell component 
      <Bell bellIcon={{ uri: '../../assets/notification_bell.png' }} /> */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
