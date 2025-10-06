import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'react-native';

const FotoPerfil = ({ userId }) => (
  <View style={styles.container}>
    {userId ? (
      <Image
        source={{ uri: `http://192.168.1.135:3000/api/auth/user/${userId}/foto` }}
        style={styles.foto}
      />
    ) : (
      <Text>Sin foto de perfil</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  foto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eee',
    marginBottom: 8,
  },
  container: {
    padding: 16,
  },
});

export default FotoPerfil;
