import EncryptedStorage from 'react-native-encrypted-storage';

const TOKEN_KEY = 'vura.jwtToken';

export const saveToken = async (token: string) => {
  await EncryptedStorage.setItem(TOKEN_KEY, token);
};

//  Retrieve the stored authentication token, returns null if no token exists
export const getToken = async (): Promise<string | null> => {
  const val = await EncryptedStorage.getItem(TOKEN_KEY);
  return val ?? null;
};

// Remove the stored authentication token, called on logout or when the token is invalid/expired
export const deleteToken = async () => {
  await EncryptedStorage.removeItem(TOKEN_KEY);
};
