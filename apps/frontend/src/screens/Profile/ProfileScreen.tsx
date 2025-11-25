import { ToggleButton } from '../../components/ToggleButton/ToggleButton';
import { Avatar } from '../../components/Avatar/Avatar';
import { GET_USER_PROFILE } from '../../graphql';
import { GetUserProfileQuery } from '../../__generated__/graphql';
import React, { useState } from 'react';
import { BottomNavBar } from '../../components/BottomNavBar';
import { useAuth } from '../../hooks/useAuth';
import { Text, View, StyleSheet, Pressable, Image } from 'react-native';
import { useQuery } from '@apollo/client/react';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = () => {
  const { currentUser } = useAuth({});

  const { data, loading, error } = useQuery<GetUserProfileQuery>(GET_USER_PROFILE);

  const [privacyToggle, setPrivacyToggle] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // at first it will be null and then a string once image is selected

  const profile = data?.userProfile;

  if (!currentUser) {
    return <Text>You must log in to view your profile.</Text>;
  }

  if (loading) {
    return <Text>Loading profile....</Text>;
  }
  if (error) {
    return <Text>Error loading profile</Text>;
  }

  const pickImageAsync = async () => {
    // requesting permission to access camera roll
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('We need permission to access your camera roll to upload a new avatar image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3], //this is what google recomended, but not sure how to calculate for our needs
      quality: 1, //highest quality option
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri); // saving image to state - uri = local file path = assets[0] (there is only one image to choose from)
    } else {
      alert('You did not select any image.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>
      <View>
        <View stye={styles.headerAvatarContainer}>
          <Avatar size="lg"></Avatar>
          <Pressable onPress={pickImageAsync}>
            <Image
              source={require('../../../assets/pencil_icon.png')}
              style={styles.headerPencilIcon}
            />
          </Pressable>
        </View>
        <Text style={styles.headerName}>{profile?.name}</Text>
        <Text style={styles.headerEmail}>{profile?.email}</Text>
      </View>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>Hide my avatar, and display my name as initials</Text>
        <ToggleButton value={privacyToggle} onValueChange={setPrivacyToggle} />
      </View>

      <View style={styles.profileDataContainer}>
        <View style={styles.profileDataRow}>
          <View style={styles.profileDataTextColumn}>
            <Text style={styles.profileDataLabel}>Name</Text>
            <Text style={styles.profileDataUserInfo}> {profile?.name}</Text>
          </View>
          <Pressable onPress={() => console.log('TODO: editable icon')}>
            <Image
              source={require('../../../assets/pencil_icon.png')}
              style={styles.profileDataPencilIcon}
            />
          </Pressable>
        </View>
        <View style={styles.profileDataRow}>
          <View style={styles.profileDataTextColumn}>
            <Text style={styles.profileDataLabel}>Age</Text>
            <Text style={styles.profileDataUserInfo}> {profile?.age}</Text>
          </View>
          <Pressable onPress={() => console.log('TODO: editable icon')}>
            <Image
              source={require('../../../assets/pencil_icon.png')}
              style={styles.profileDataPencilIcon}
            />
          </Pressable>
        </View>
        <View style={styles.profileDataRow}>
          <View style={styles.profileDataTextColumn}>
            <Text style={styles.profileDataLabel}>Gender</Text>
            <Text style={styles.profileDataUserInfo}> {profile?.gender}</Text>
          </View>
          <View style={styles.profileDataRow}>
            <View style={styles.profileDataTextColumn}>
              <Text style={styles.profileDataLabel}>Email</Text>
              <Text style={styles.profileDataUserInfo}> {profile?.email}</Text>
            </View>
            <Pressable onPress={() => console.log('TODO: editable icon')}>
              <Image
                source={require('../../../assets/pencil_icon.png')}
                style={styles.profileDataPencilIcon}
              />
            </Pressable>
          </View>
          <Pressable onPress={() => console.log('TODO: editable icon')}>
            <Image
              source={require('../../../assets/pencil_icon.png')}
              style={styles.profileDataPencilIcon}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.footerLinks}>
        <Pressable onPress={() => console.log('TODO: Link to privacy policy')}>
          <Text style={styles.footerLinkPrivacy}>Privacy Policy</Text>
        </Pressable>
        ={' '}
        <Pressable onPress={() => console.log('TODO: logout handler')}>
          <Text style={styles.footerLinkLogout}>Logout</Text>
        </Pressable>
        <Pressable onPress={() => console.log('TODO: delete account handler')}>
          <Text style={styles.footerLinkDelete}>Delete Account</Text>
        </Pressable>
      </View>
      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 0,
    padding: 24,
  },
  header: {
    fontSize: 16,
    lineHeight: 20,
    color: '#363636',
  },
  headerAvatarContainer: {},
  headerPencilIcon: {
    height: 16,
    width: 16,
  },
  headerName: {
    fontSize: 20,
    lineHeight: 1.2,
    color: '#363636',
  },
  headerEmail: {
    fontSize: 16,
    lineHeight: 20,
    color: '#363636',
    opacity: 0.5,
  },

  toggleContainer: {
    backgroundColor: '#F6F4FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E7E7',
    height: 70,
    width: 345,
    margin: 0,
    padding: 16,
  },
  toggleText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#363636',
  },
  profileDataContainer: {
    color: '#F6F4FA',
    borderWidth: 1,
    borderColor: '#E7E7E7',
    borderRadius: 20,
    margin: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  profileDataRow: {},
  profileDataTextColumn: {},
  profileDataLabel: {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 20,
    color: '#363636',
    opacity: 0.5,
  },
  profileDataUserInfo: { fontSize: 18, fontWeight: 400, lineHeight: 22 },
  profileDataPencilIcon: {
    height: 16,
    width: 16,
  },

  footerLinks: {},
  footerLinkPrivacy: {
    fontSize: 18,
    lineHeight: 20,
    color: '#363636',
    opacity: 0.5,
  },
  footerLinkLogout: {
    fontSize: 18,
    lineHeight: 20,
    color: '#F12D2D',
  },
  footerLinkDelete: {
    fontSize: 18,
    lineHeight: 20,
    color: '#F12D2D',
  },
});

export default ProfileScreen;
