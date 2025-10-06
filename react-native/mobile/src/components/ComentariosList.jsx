import * as React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../utils/api';
import Toast from './Toast';

const ComentariosList = ({ postId, comentarioAgregado }) => {
  const [comentarios, setComentarios] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [toast, setToast] = React.useState({ visible: false, message: '', type: 'info' });
  const navigation = useNavigation();

  React.useEffect(() => {
    const fetchComentarios = async () => {
      try {
        const response = await api.get(`/paginas/${postId}/comentarios`);
        console.log('Comentarios recibidos:', response.data);
        setComentarios(response.data);
        setError('');
      } catch (err) {
        setError('Error al cargar los comentarios');
      } finally {
        setLoading(false);
      }
    };
    if (postId) fetchComentarios();
  }, [postId, comentarioAgregado]);

  if (loading) {
    return <ActivityIndicator size="small" color="#007AFF" style={styles.loading} />;
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comentarios</Text>
      <FlatList
        data={comentarios}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.comentario}>
            {item.username ? (
              <TouchableOpacity onPress={() => navigation.navigate('UserPage', { username: item.username })}>
                <Text style={[styles.autor, styles.link]}>{item.username}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.autor}>Anónimo</Text>
            )}
            <Text style={styles.texto}>{item.comentario || ''}</Text>
          </View>
        )}
      />
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
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
    loading: {
      marginTop: 16,
    },
  container: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  comentario: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
  },
  autor: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  texto: {
    fontSize: 15,
    color: '#333',
  },
  error: {
    color: 'red',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ComentariosList;
