import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image, ScrollView } from 'react-native';
import api from '../utils/api';

const ImageGrid = ({ paginaId }) => {
  const [imagenes, setImagenes] = React.useState([]);
  React.useEffect(() => {
    const fetchImagenes = async () => {
      try {
        if (paginaId) {
          const response = await api.get(`/paginas/1e318e2f3c2b495d85c0f1b24d4f7620?action=info`);
          setImagenes(response.data);
        }
      } catch {
        setImagenes([]);
      }
    };
    fetchImagenes();
  }, [paginaId]);
  if (!paginaId) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Galería</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {imagenes.length === 0 ? (
          <Text style={styles.empty}>Sin imágenes</Text>
        ) : (
          imagenes.map(img => (
            <Image
              key={img.idx}
              source={{ uri: img.src }}
              style={styles.imagen}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  imagen: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  empty: {
    color: '#888',
    fontSize: 15,
    marginTop: 8,
  },
  container: {
    padding: 16,
  },
});

export default ImageGrid;
