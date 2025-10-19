import React, { useEffect, useRef, Suspense, lazy } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import OutputMenu from "./components/OutputMenu";
import useAuthStore from "./stores/authStore";
import { useFeed } from "./hooks/useFeed";

// Lazy loading de componentes de páginas
const Feed = lazy(() => import("./components/Feed"));
const RegisterPage = lazy(() => import("./components/RegisterPage"));
const LoginPage = lazy(() => import("./components/LoginPage"));
const UserPage = lazy(() => import("./components/UserPage"));
const AccountPage = lazy(() => import("./components/AccountPage"));
const CreatePublication = lazy(() => import("./components/CreatePublication"));
const PageBuilder = lazy(() => import("./components/PageBuilder"));
const PoliticaDeCookies = lazy(() => import("./components/PoliticaDeCookies"));
const Privacidad = lazy(() => import("./components/Privacidad"));

// Componente de carga para Suspense fallback
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '18px',
    color: '#666'
  }}>
    <div>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 10px'
      }}></div>
      Cargando...
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function MainApp({ showOutput }) {
  const { data: feed = [], isLoading, error } = useFeed();
  const lastMessageRef = useRef("");

  // Mostrar mensajes de carga y error
  useEffect(() => {
    let message = "";
    if (isLoading) {
      message = "Cargando feed...";
    } else if (error) {
      message = "Error al cargar el feed";
    } else if (feed.length > 0) {
      message = `Feed cargado: ${feed.length} entradas`;
    } else {
      message = "No hay entradas disponibles en el feed.";
    }

    if (message !== lastMessageRef.current) {
      showOutput(message, isLoading ? "info" : error ? "error" : "success");
      lastMessageRef.current = message;
    }
  }, [isLoading, error, feed, showOutput]);

  const goToFeed = (e) => {
    e.preventDefault();
    // El feed se recarga automáticamente con React Query
  };

  return (
    <>
      <Navbar onFeedClick={goToFeed} />
      <Suspense fallback={<LoadingFallback />}>
        <Feed feed={feed} />
      </Suspense>
    </>
  );
}

export default function App() {
  const { verifyAuthIfNeeded, initializeFromStorage } = useAuthStore();
  const [output, setOutput] = React.useState({ message: "", type: "" });
  const [outputMinimized, setOutputMinimized] = React.useState(false);
  const authInitialized = useRef(false);

  // Inicializar estado desde localStorage al cargar la app
  useEffect(() => {
    if (!authInitialized.current) {
      // Primero inicializar desde localStorage si hay datos
      initializeFromStorage();

      // Luego verificar autenticación con el servidor solo si es necesario
      verifyAuthIfNeeded();
      authInitialized.current = true;
    }
  }, [verifyAuthIfNeeded, initializeFromStorage]);

  // Output global
  const showOutput = React.useCallback((message, type = "info") => {
    if (Array.isArray(message)) {
      setOutput({ message: message.map((m) => <div key={m}>{m}</div>), type });
    } else {
      setOutput({ message, type });
    }
    setOutputMinimized(true);
  }, []);

  function toggleOutputMinimize() {
    setOutputMinimized((min) => !min);
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <MainApp
              showOutput={showOutput}
            />
          }
        />
        <Route
          path="/registro"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <RegisterPage
                showOutput={showOutput}
              />
            </Suspense>
          }
        />
        <Route
          path="/login"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <LoginPage
                showOutput={showOutput}
              />
            </Suspense>
          }
        />
        <Route
          path="/cuenta"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <AccountPage />
            </Suspense>
          }
        />
        {/* Ruta para crear publicaciones - DEBE ir ANTES que las rutas con parámetros */}
        <Route
          path="/:username/publicar"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PageBuilder />
            </Suspense>
          }
        />
        {/* Ruta para listas de páginas públicas */}
        <Route
          path="/pagina/:username"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <UserPage />
            </Suspense>
          }
        />
        {/* Ruta para ver publicación específica por ID numérico */}
        <Route
          path="/:username/publicacion/:publicacionId"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <UserPage />
            </Suspense>
          }
        />
        {/* Ruta alternativa para nueva publicación */}
        <Route
          path="/:username/nuevapublicacion"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PageBuilder />
            </Suspense>
          }
        />
        <Route
          path="/politica-de-cookies.html"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PoliticaDeCookies />
            </Suspense>
          }
        />
        <Route
          path="/privacidad.html"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Privacidad />
            </Suspense>
          }
        />
      </Routes>
      <OutputMenu
        outputMsg={output.message}
        outputType={output.type}
        outputMinimized={outputMinimized}
        toggleOutputMinimize={toggleOutputMinimize}
      />
    </Router>
  );
}
