import React, { useEffect, useRef, Suspense, lazy } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/ui/Navbar";
import OutputMenu from "./components/ui/OutputMenu";

// Lazy loading de componentes de páginas
const Feed = lazy(() => import("./components/feed/Feed"));
const RegisterPage = lazy(() => import("./components/auth/RegisterPage"));
const LoginPage = lazy(() => import("./components/auth/LoginPage"));
const UserPage = lazy(() => import("./components/main/UserPage"));
const AccountPage = lazy(() => import("./components/main/AccountPage"));
const CreatePublication = lazy(() => import("./components/main/CreatePublication"));
const PageBuilder = lazy(() => import("./components/main/PageBuilder"));
const PoliticaDeCookies = lazy(() => import("./components/policy/PoliticaDeCookies"));
const Privacidad = lazy(() => import("./components/policy/Privacidad"));

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
  const lastMessageRef = useRef("");

  // Mostrar mensaje inicial
  useEffect(() => {
    const message = "Aplicación cargada correctamente.";
    if (message !== lastMessageRef.current) {
      showOutput(message, "success");
      lastMessageRef.current = message;
    }
  }, [showOutput]);

  const goToFeed = (e) => {
    e.preventDefault();
    // El feed se maneja en el componente Feed
  };

  return (
    <>
      <Navbar onFeedClick={goToFeed} />
      <Suspense fallback={<LoadingFallback />}>
        <Feed />
      </Suspense>
    </>
  );
}

export default function App() {
  const [output, setOutput] = React.useState({ message: "", type: "" });
  const [outputMinimized, setOutputMinimized] = React.useState(false);
  const authInitialized = useRef(false);


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
