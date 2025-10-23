import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

//Props expected by the ForumCard component
interface ForumCardProps {
  id: string; //unique post id used for navigation
  title: string;
  preview: string;
  commentsCount: number;
  author: string;
  timeAgo: string;
}

export default function ForumCard({
  id,
  title,
  preview,
  commentsCount,
  author,
  timeAgo,
}: ForumCardProps) {
  //Allows navigation to anoher screen when the card is pressed
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity //makes the entire card cickable
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ForumPost', { postId: id })}
    >
      {/* Post title and preview text of the forum post */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.preview}>{preview}</Text>

      {/* Footer: comment icon and count, author name, and post time */}
      <View style={styles.footer}>
        <View style={styles.commentRow}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.commentText}>{commentsCount}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.author}>{author}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F6F4FA',
    borderWidth: 1,
    borderColor: '#E7E7E7',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: '90%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  preview: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  //comment icon and count
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentText: {
    marginLeft: 4,
    color: '#666666',
    fontSize: 13,
  },
  //layout for author and time section
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  author: {
    color: '#777777',
    fontSize: 13,
  },
  dot: {
    marginHorizontal: 4,
    color: '#AAAAAA',
  },
  time: {
    color: '#999999',
    fontSize: 13,
  },
});
