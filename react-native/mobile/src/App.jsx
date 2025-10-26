import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Feed from './components/Feed';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import UserPage from './components/UserPage';
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Navbar />
        <Stack.Navigator initialRouteName="Feed">
        <Stack.Screen name="Feed" component={Feed} options={{ title: 'Inicio' }} />
        <Stack.Screen name="Login" component={LoginPage} options={{ title: 'Iniciar sesión' }} />
        <Stack.Screen name="Registro" component={RegisterPage} options={{ title: 'Registro' }} />
        <Stack.Screen name="UserPage" component={UserPage} options={{ title: 'Perfil de usuario' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
