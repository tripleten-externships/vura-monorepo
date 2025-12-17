import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

/**
 * Simple navigation page to help with routing issues
 * This bypasses all authentication and provides direct links
 */
const NavigationHelper: React.FC = () => {
  const openLink = (url: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 Questionnaire Navigation</Text>
        <Text style={styles.subtitle}>Direct access to all demo pages</Text>
      </View>

      <View style={styles.linksContainer}>
        <TouchableOpacity
          style={[styles.linkButton, styles.primaryButton]}
          onPress={() => openLink('/mobile-demo')}
        >
          <Text style={styles.linkTitle}>📱 Mobile Demo (iPhone Format)</Text>
          <Text style={styles.linkDescription}>
            iPhone-style viewport for accurate mobile styling
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => openLink('/enhanced-demo')}>
          <Text style={styles.linkTitle}>🎯 Enhanced Demo</Text>
          <Text style={styles.linkDescription}>
            Complete questionnaire with validation feedback
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => openLink('/component-demos')}>
          <Text style={styles.linkTitle}>🧩 Component Demos</Text>
          <Text style={styles.linkDescription}>Individual components for styling</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => openLink('/standalone-demo')}>
          <Text style={styles.linkTitle}>🎯 Standalone Demo</Text>
          <Text style={styles.linkDescription}>Full questionnaire flow</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => openLink('/questionnaire-demo')}>
          <Text style={styles.linkTitle}>📋 Original Demo</Text>
          <Text style={styles.linkDescription}>Basic questionnaire demo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.debugInfo}>
        <Text style={styles.debugTitle}>🔍 Debug Info</Text>
        <Text style={styles.debugText}>
          Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
        </Text>
        <Text style={styles.debugText}>
          Pathname: {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}
        </Text>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📝 If demos still don't work:</Text>
        <Text style={styles.instructionText}>
          1. Try directly typing the URLs in your browser address bar
        </Text>
        <Text style={styles.instructionText}>2. Clear your browser cache (Ctrl+Shift+R)</Text>
        <Text style={styles.instructionText}>3. Check the browser console (F12) for errors</Text>
        <Text style={styles.instructionText}>4. Restart the development server</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },

  header: {
    alignItems: 'center',
    marginBottom: 32,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 18,
    color: '#6C757D',
  },

  linksContainer: {
    gap: 16,
    marginBottom: 32,
  },

  linkButton: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
  },

  primaryButton: {
    backgroundColor: '#007AFF',
  },

  linkTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },

  linkDescription: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },

  debugInfo: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },

  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },

  debugText: {
    fontSize: 12,
    color: '#1976D2',
    fontFamily: 'monospace',
    marginBottom: 4,
  },

  instructions: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
  },

  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 12,
  },

  instructionText: {
    fontSize: 14,
    color: '#BF360C',
    marginBottom: 6,
  },
});

export default NavigationHelper;
