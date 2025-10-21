import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

//Navigation images to get to different screens
import checklist from '../../assets/checklist.png';
import resources from '../../assets/resources.png';
import community from '../../assets/community_forums.png';
import profile from '../../assets/profile.png';

export default function BottomNav() {
  const navigation = useNavigation();

  return (
    //represents each nav icon that is clickable
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('Checklist' as never)}>
        <Image source={checklist} style={styles.icon} resizeMode="contain" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Resources' as never)}>
        <Image source={resources} style={styles.icon} resizeMode="contain" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Community_Forums' as never)}>
        <Image source={community} style={styles.icon} resizeMode="contain" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Profile' as never)}>
        <Image source={profile} style={styles.icon} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
}

//styling may not be completely correct
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 72,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingBottom: 10,
  },
  icon: {
    width: 24,
    height: 24,
  },
});
