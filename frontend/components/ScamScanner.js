import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Shield, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { scanMessage } from '@/utils/api';

export default function ScamScanner() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && !url.trim()) {
      toast.error('Please enter a message or URL to scan');
      return;
    }

    setScanning(true);
    
    try {
      const result = await scanMessage({ message, url });
      
      // Store original message for reporting
      result.originalMessage = message;
      
      // Navigate to results page with data
      const queryString = encodeURIComponent(JSON.stringify(result));
      router.push(`/results?data=${queryString}`);
      
    } catch (error) {
      console.error('Scan failed:', error);
      toast.error(error.message || 'Failed to scan message. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleClear = () => {
    setMessage('');
    setUrl('');
  };

  const handleSampleScam = () => {
    setMessage('URGENT: Your account will be suspended! Click here immediately to verify: bit.ly/verify123');
    setUrl('bit.ly/verify123');
  };

  const handleSampleSafe = () => {
    setMessage('Hey, are we still on for lunch tomorrow at 12pm? Let me know if the time works for you.');
    setUrl('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4"
        >
          <Shield className="w-8 h-8 text-blue-600" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan for Scams</h2>
        <p className="text-gray-600">Paste a suspicious message or URL to check if it's a scam</p>
      </div>

      <form onSubmit={handleScan} className="space-y-6">
        {/* Message Input */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message Content
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste the suspicious message here..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
            rows={4}
            disabled={scanning}
          />
        </div>

        {/* URL Input */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            URL (Optional)
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/suspicious-link"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            disabled={scanning}
          />
        </div>

        {/* Sample Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSampleScam}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            disabled={scanning}
          >
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            Try Scam Example
          </button>
          <button
            type="button"
            onClick={handleSampleSafe}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
            disabled={scanning}
          >
            <CheckCircle className="w-4 h-4 inline mr-1" />
            Try Safe Example
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            disabled={scanning}
          >
            Clear
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={scanning || (!message.trim() && !url.trim())}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-lg"
        >
          {scanning ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Analyzing...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Scan Message
            </>
          )}
        </button>
      </form>

      {/* Features */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">AI Powered</p>
            <p className="text-xs text-gray-600">Advanced NLP analysis</p>
          </div>
          <div className="p-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Instant Results</p>
            <p className="text-xs text-gray-600">Real-time scam detection</p>
          </div>
          <div className="p-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Blockchain Secured</p>
            <p className="text-xs text-gray-600">Immutable scam registry</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
