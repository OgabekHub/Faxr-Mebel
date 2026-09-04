import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import './lib/i18n'; // Init i18n
import { AnimatePresence, motion } from 'motion/react';

// Lazy load pages for code-splitting
const Home = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Shop = React.lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })));
const Auth = React.lazy(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Admin = React.lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Cart = React.lazy(() => import('./pages/Cart').then(m => ({ default: m.Cart })));
const Contact = React.lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const About = React.lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Profile = React.lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const ARView = React.lazy(() => import('./pages/ARView').then(m => ({ default: m.ARView })));
const NotFound = React.lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

// Loading Fallback for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin"></div>
  </div>
);

/**
 * Page transition wrapper. Suspense lives *inside* the animated element so
 * AnimatePresence always sees a single, stable child per route and the exit
 * animation runs even when the next page's chunk is still downloading.
 */
const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.99 }}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      className="page-transition-container"
    >
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </motion.div>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    // `instant` overrides the global `scroll-behavior: smooth`, otherwise every
    // route change visibly scrolls the old page up before the new one appears.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  const isCartPage = location.pathname === '/cart';
  const isFooterHidden = isAuthPage || isCartPage;

  return (
    <div className="min-h-screen flex flex-col selection:bg-brand-gold selection:text-white">
      {!isAuthPage && <Navbar />}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/shop" element={<PageWrapper><Shop /></PageWrapper>} />
            <Route path="/auth" element={<PageWrapper><Auth /></PageWrapper>} />

            {/* Protected Routes */}
            <Route path="/admin" element={<AdminRoute><PageWrapper><Admin /></PageWrapper></AdminRoute>} />
            <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />

            <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
            <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
            <Route path="/cart" element={<PageWrapper><Cart /></PageWrapper>} />
            <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </main>
      {!isFooterHidden && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <ErrorBoundary>
                {/* Top-level Suspense covers Navbar/Footer translations (useTranslation suspends until the locale file loads). */}
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Full-screen AR experience: no navbar / footer. */}
                    <Route path="/ar/:productId" element={<ARView />} />
                    <Route path="*" element={<AppLayout />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </Router>
          </CartProvider>
        </WishlistProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
