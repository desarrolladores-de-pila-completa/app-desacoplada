import * as React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Toast from './Toast';

const LoginPage = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [toast, setToast] = React.useState({ visible: false, message: '', type: 'info' });
  const navigation = useNavigation();

  const BASE_URL = 'http://10.0.2.2:3000';
  const handleLogin = async () => {
    try {
      // Obtener CSRF
      const res = await fetch(BASE_URL + '/api/csrf-token', { credentials: 'include' });
      const data = await res.json();
      const csrfToken = data.csrfToken;
      const response = await api.post('/auth/login', { email, password }, {
        headers: {
          'X-CSRF-Token': csrfToken || '',
          'Cookie': `_csrf=${csrfToken}`,
        },
        withCredentials: true,
      });
      console.log('[LOGIN] Respuesta:', response);
      await AsyncStorage.setItem('token', response.data.token);
      setError('');
      setToast({ visible: true, message: 'Login exitoso', type: 'success' });
      // Navegar a la página de usuario si el backend devuelve username
      const username = response.data.username;
      if (username) {
        navigation.replace('UserPage', { username });
      } else {
        navigation.replace('Feed');
      }
    } catch (err) {
      console.log('[LOGIN] Error:', err);
      if (err.response) {
        console.log('[LOGIN] Error response data:', err.response.data);
        setError('Credenciales incorrectas: ' + (err.response.data?.error || ''));
        setToast({ visible: true, message: 'Credenciales incorrectas', type: 'error' });
      } else {
        setError('Error de red o servidor');
        setToast({ visible: true, message: 'Error de red o servidor', type: 'error' });
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
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
      <Button title="Entrar" onPress={handleLogin} />
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

export default LoginPage;
