import * as React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import api from '../utils/api';
import { useNavigation } from '@react-navigation/native';
import Toast from './Toast';

const RegisterPage = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [nombre, setNombre] = React.useState('');
  const [error, setError] = React.useState('');
  const [toast, setToast] = React.useState({ visible: false, message: '', type: 'info' });
  const navigation = useNavigation();

  const BASE_URL = 'http://10.0.2.2:3000';
  const handleRegister = async () => {
    try {
      // Obtener CSRF
      const csrfRes = await fetch(BASE_URL + '/api/csrf-token', { credentials: 'include' });
      const data = await csrfRes.json();
      const csrfToken = data.csrfToken;
      const res = await api.post('/auth/register', { email, password, nombre }, {
        headers: {
          'X-CSRF-Token': csrfToken || '',
          'Cookie': `_csrf=${csrfToken}`,
        },
        withCredentials: true,
      });
      setError('');
      setToast({ visible: true, message: 'Registro exitoso', type: 'success' });
      // Navegar a la página de usuario si el backend devuelve username
      const username = res.data?.username;
      if (username) {
        navigation.replace('UserPage', { username });
      } else {
        navigation.replace('Login');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al registrar usuario';
      setError(errorMessage);
      setToast({ visible: true, message: errorMessage, type: 'error' });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Registrarse" onPress={handleRegister} />
      {toast.visible && (
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default RegisterPage;
