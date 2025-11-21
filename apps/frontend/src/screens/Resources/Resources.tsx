import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { BottomNavBar } from '../../components/BottomNavBar';
import { useResourceStore } from '../../store/StoreContext';

const ResourcesScreen = observer(() => {
  const resourceStore = useResourceStore();

  useEffect(() => {
    resourceStore.fetchResources({ first: 5 });
  }, [resourceStore]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Curated self and elderly care resources</Text>

      {resourceStore.loading ? (
        <ActivityIndicator size="small" color="#333" />
      ) : resourceStore.error ? (
        <Text style={styles.error}>{resourceStore.error}</Text>
      ) : (
        resourceStore.resources.map((resource) => (
          <View key={resource.id} style={styles.card}>
            <Text style={styles.cardTitle}>{resource.content}</Text>
            <Text style={styles.cardLink}>{resource.link}</Text>
            {resource.checklist?.name ? (
              <Text style={styles.cardMeta}>Checklist: {resource.checklist.name}</Text>
            ) : null}
          </View>
        ))
      )}

      <BottomNavBar />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  error: {
    color: '#b00020',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardLink: {
    color: '#007AFF',
    marginBottom: 4,
  },
  cardMeta: {
    color: '#555',
  },
});

export default ResourcesScreen;
