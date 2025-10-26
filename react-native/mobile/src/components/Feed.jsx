import * as React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../utils/api';
import Toast from './Toast';
import GlobalChat from './GlobalChat';

const Feed = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [toast, setToast] = React.useState({ visible: false, message: '', type: 'info' });

  // Función para renderizar cada item del feed
  const renderFeedItem = ({ item }) => {
    // Extraer imagen
    const imgMatch = item.mensaje?.match(/<img[^>]*src=['"]([^'"]+)['"][^>]*>/);
    // Extraer enlaces <a href="/pagina/USERNAME">NOMBRE</a>
    const linkRegex = /<a[^>]*href=['"]([^'"]+)['"][^>]*>([^<]+)<\/a>/g;
    let links = [];
    let match;
    while ((match = linkRegex.exec(item.mensaje))) {
      links.push({ href: match[1], text: match[2] });
    }
    // Quitar imagen y enlaces del texto
    let textOnlyRaw = item.mensaje?.replace(/<img[^>]*>/g, '').replace(linkRegex, '');
    // Repeatedly strip all remaining tags (e.g. <script>, edge cases) until none remain
    let previousText;
    let textOnly = textOnlyRaw;
    do {
      previousText = textOnly;
      textOnly = textOnly.replace(/<[^>]+>/g, '');
    } while (textOnly !== previousText);

    return (
      <View style={styles.post}>
        {imgMatch && (
          <Image
            source={{ uri: `http://192.168.1.135:3000${imgMatch[1]}` }}
            style={styles.feedImage}
          />
        )}
        <Text style={styles.postContent}>{textOnly || 'Sin mensaje'}</Text>
        {links.map((link, idx) => {
          // Si el enlace es a /pagina/USERNAME, navega a UserPage
          const userMatch = link.href.match(/\/pagina\/(.+)/);
          if (userMatch) {
            const username = userMatch[1];
            return (
              <Text
                key={idx}
                style={styles.postLink}
                onPress={() => navigation.navigate('UserPage', { username })}
              >
                {link.text}
              </Text>
            );
          }
          // Otros enlaces: abrir en navegador externo
          return (
            <Text
              key={idx}
              style={styles.postLink}
              onPress={() => Linking.openURL(link.href)}
            >
              {link.text}
            </Text>
          );
        })}
      </View>
    );
  };

  React.useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get('/feed'); // Ajusta el endpoint según tu backend
        setPosts(response.data);
        setError('');
      } catch (err) {
        setError('Error al cargar el feed');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

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
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderFeedItem}
      />
      <GlobalChat />
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
  feedImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
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
  error: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 32,
  },
  post: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  postContent: {
    fontSize: 16,
    color: '#333',
  },
  postLink: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
});

export default Feed;
