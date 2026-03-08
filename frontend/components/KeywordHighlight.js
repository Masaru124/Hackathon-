import { motion } from 'framer-motion';

export default function KeywordHighlight({ keyword }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
    >
      <span className="truncate max-w-xs">{keyword}</span>
    </motion.div>
  );
}
