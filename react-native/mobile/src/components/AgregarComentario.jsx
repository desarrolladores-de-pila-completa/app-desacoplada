import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native';
import api from '../utils/api';
import CookieManager from '@react-native-cookies/cookies';
import Toast from './Toast';

// import { getTokenCookie } from '../utils/getTokenCookie';

// Usar la IP especial para acceder a localhost desde el emulador Android
const BASE_URL = 'http://10.0.2.2:3000';
const AgregarComentario = ({ paginaId, onComentarioAgregado }) => {
  const [comentario, setComentario] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [toast, setToast] = React.useState({ visible: false, message: '', type: 'info' });

  const handleSubmit = async () => {
    if (!comentario.trim()) return;
    setLoading(true);
    setError('');
    setMsg('');
  try {
      // Obtener el token CSRF justo antes del POST
      const res = await fetch(BASE_URL + '/api/csrf-token', {
        credentials: 'include',
      });
      const data = await res.json();
      const csrfToken = data.csrfToken;
      // Escribir el token en la cookie _csrf
      await CookieManager.set(BASE_URL, {
        name: '_csrf',
        value: csrfToken,
        path: '/',
      });
      // Esperar a que la cookie se escriba correctamente
      setTimeout(async () => {
        console.log('CSRF token que se envía:', csrfToken);
        // Eliminar lógica de token, solo enviar CSRF
        await api.post(
          `/paginas/${paginaId}/comentarios`,
          { comentario },
          {
            headers: {
              'X-CSRF-Token': csrfToken || '',
              'Cookie': `_csrf=${csrfToken}`,
            },
            withCredentials: true,
          }
        );
        setComentario('');
        setMsg('Comentario agregado!');
        setToast({ visible: true, message: 'Comentario agregado!', type: 'success' });
        setLoading(false);
        if (typeof onComentarioAgregado === 'function') {
          onComentarioAgregado();
        }
      }, 200);
    } catch (err) {
      setError('Error al agregar comentario');
      setToast({ visible: true, message: 'Error al agregar comentario', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  if (!paginaId) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Agregar Comentario</Text>
      <TextInput
        style={styles.input}
        value={comentario}
        onChangeText={setComentario}
        placeholder="Escribe tu comentario..."
        editable={!loading}
      />
      <Button
        title="Enviar"
        onPress={handleSubmit}
        disabled={loading || !comentario.trim()}
      />
      {msg ? <Text style={styles.success}>{msg}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  success: {
    color: 'green',
    marginTop: 8,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  error: {
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
  },
  container: {
    padding: 16,
  },
});

export default AgregarComentario;
