import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UserHeader = () => (
  <View style={styles.container}>
    <Text>Encabezado de Usuario</Text>
    {/* Adaptar lógica y renderizado aquí */}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});

export default UserHeader;
