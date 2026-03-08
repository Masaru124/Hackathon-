import '@/styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <motion.div
        initial="initial"
        animate="animate"
        variants={{
          initial: { opacity: 0 },
          animate: { opacity: 1 },
        }}
        transition={{ duration: 0.3 }}
      >
        <Component {...pageProps} />
      </motion.div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default MyApp;
