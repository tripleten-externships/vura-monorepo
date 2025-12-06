import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useMutation } from '@apollo/client/react';
import { DELETE_ACCOUNT } from '../../graphql/mutations/index';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountProps {
  currentUserName?: string;
}

export default function DeleteAccount({ currentUserName }: DeleteAccountProps) {
  const auth = useAuth({});
  const [typedName, setTypedName] = useState('');
  const [checked, setChecked] = useState(false);
  //   const [debouncedName, setDebouncedName] = useState('');
  const navigate = useNavigate();

  // delete the user account and navigate to start page
  const [deleteAccount, { loading }] = useMutation(DELETE_ACCOUNT, {
    onCompleted: async (data) => {
      console.log('delete response:', data);
      await auth.logout();
      navigate('/get-started');
    },
  });

  //delete the user account if name is typed correctly and checkbox is checked
  const handleDelete = () => {
    console.log('handleDelete called');
    if (typedName === currentUserName && checked) {
      deleteAccount({ variables: { name: currentUserName } });
    }
  };
  //   useEffect(() => {
  //     const timer = setTimeout(() => {
  //       setDebouncedName(typedName);
  //     }, 500);

  //     return () => clearTimeout(timer);
  //   }, [typedName]);

  //   useEffect(() => {
  //     if (debouncedName) {
  //       handleDelete();
  //     }
  //   }, [debouncedName]);

  console.log('typedName:', typedName);
  console.log('currentUserName:', currentUserName);
  console.log('equal?:', typedName === currentUserName);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Confirm Delete Account</Text>

      <Text style={styles.instruction}>Please type your name to confirm.</Text>
      <TextInput
        value={typedName}
        onChangeText={setTypedName}
        placeholder="Type your name"
        placeholderTextColor="#36363680"
        style={styles.input}
      />

      <View style={styles.checkboxContainer}>
        <Text onPress={() => setChecked(!checked)} style={styles.checkbox}>
          {checked ? '☑' : '☐'}
        </Text>
        <Text style={styles.checkboxLabel}>I understand this action cannot be undone.</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable onPress={() => navigate(-1 as any)} style={styles.cancelButton}>
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handleDelete}
          disabled={typedName !== currentUserName || !checked}
          style={({ pressed }) => [
            styles.deleteButton,
            { opacity: pressed ? 0.7 : 1 },
            (typedName !== currentUserName || !checked) && { backgroundColor: '#F12D2D99' },
          ]}
        >
          <Text style={styles.buttonText}>{loading ? 'Deleting...' : 'Delete'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  instruction: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 10,
    marginVertical: 12,
    color: '#000000',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 8,
  },
  checkboxLabel: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#F12D2D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
