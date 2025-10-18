import * as React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../utils/api';
import FotoPerfil from './FotoPerfil';
import ImageGrid from './ImageGrid';
import ComentariosList from './ComentariosList';
import AgregarComentario from './AgregarComentario';
import Toast from './Toast';

const UserPage = () => {
  const [comentarioAgregado, setComentarioAgregado] = React.useState(0);
  const route = useRoute();
  const navigation = useNavigation();
  const username = route.params?.username;
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [deleteMsg, setDeleteMsg] = React.useState('');
  const [toast, setToast] = React.useState({ visible: false, message: '', type: 'info' });

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        // Consultar el usuario por username (ruta corregida)
        const response = await api.get(`/paginas/${username}`);
        setUser(response.data);
        setError('');
        // Ya no se cargan comentarios aquí, ComentariosList lo hace por sí mismo
      } catch (err) {
        setError('Error al cargar el usuario');
        // Ya no se cargan comentarios aquí
      } finally {
        setLoading(false);
      }
    };
    if (username) fetchUser();
    else setError('No se especificó usuario');
  }, [username]);

  // Botón de borrado de usuario (solo ejemplo, debes adaptar la lógica de autenticación)
  const handleDeleteUser = async () => {
    // Confirmación antes de borrar
    // Puedes usar Alert de React Native
    Alert.alert(
      'Confirmar borrado',
      '¿Seguro que quieres borrar tu perfil y todos tus datos? Esta acción es irreversible.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Obtener CSRF
              const csrfRes = await api.get('/csrf-token');
              const csrfToken = csrfRes.data.csrfToken;
              // Petición DELETE
              const res = await api.delete(`/paginas/usuario/${user?.user_id}`, {
                headers: { 'X-CSRF-Token': csrfToken },
                withCredentials: true,
              });
              if (res.status === 200) {
                setDeleteMsg('Tu perfil y todos tus datos han sido eliminados.');
                setToast({ visible: true, message: 'Tu perfil y todos tus datos han sido eliminados.', type: 'success' });
                setTimeout(() => {
                  navigation.navigate('Feed');
                }, 1500);
              } else {
                setDeleteMsg('Error al borrar el usuario.');
                setToast({ visible: true, message: 'Error al borrar el usuario.', type: 'error' });
              }
            } catch (err) {
              setDeleteMsg('Error de conexión al borrar el usuario.');
              setToast({ visible: true, message: 'Error de conexión al borrar el usuario.', type: 'error' });
            }
          },
        },
      ]
    );
  };

  // Render condicional después de los hooks y funciones
  if (loading) {
    return <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex1}>
      <FlatList
        style={styles.container}
        data={[]}
        ListHeaderComponent={
          <View>
            <FotoPerfil userId={user?.user_id} />
            <Text style={styles.title}>Página de Usuario</Text>
            <Text style={styles.label}>Título:</Text>
            <Text style={styles.value}>{user?.titulo || 'Sin título'}</Text>
            <Text style={styles.label}>Descripción:</Text>
            <Text style={styles.value}>{user?.descripcion || 'Sin descripción'}</Text>
            <Text style={styles.label}>Usuario:</Text>
            <Text style={styles.value}>{user?.usuario || 'Sin usuario'}</Text>
            <Text style={styles.label}>Contenido:</Text>
            <Text style={styles.value}>{user?.contenido || 'Sin contenido'}</Text>
            <ImageGrid paginaId={user?.id} />
            <AgregarComentario
              paginaId={user?.id}
              onComentarioAgregado={() => {
                setToast({ visible: true, message: 'Comentario agregado correctamente.', type: 'success' });
                setComentarioAgregado((prev) => prev + 1);
              }}
            />
            <ComentariosList postId={user?.id} comentarioAgregado={comentarioAgregado} />
            {/* Botón de borrado de usuario (solo visible si corresponde) */}
            <Text
              style={styles.deleteButton}
              onPress={handleDeleteUser}
            >
              Borrar mi perfil y todos mis datos
            </Text>
            {deleteMsg ? (
              <Text style={deleteMsg.includes('eliminados') ? styles.deleteMsgSuccess : styles.deleteMsgError}>{deleteMsg}</Text>
            ) : null}
          </View>
        }
        renderItem={null}
        keyExtractor={() => 'header'}
      />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    marginBottom: 8,
  },
  error: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 32,
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
  },
  deleteMsgSuccess: {
    color: 'green',
    marginTop: 16,
    textAlign: 'center',
  },
  deleteMsgError: {
    color: 'red',
    marginTop: 16,
    textAlign: 'center',
  },
});


export default UserPage;
