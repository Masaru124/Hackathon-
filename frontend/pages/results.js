import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, AlertCircle, ExternalLink, Share2, Flag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { scanMessage, reportScam } from '@/utils/api';
import RiskMeter from '@/components/RiskMeter';
import KeywordHighlight from '@/components/KeywordHighlight';

export default function Results() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (router.isReady && router.query.data) {
      try {
        const data = JSON.parse(decodeURIComponent(router.query.data));
        setResult(data);
      } catch (error) {
        console.error('Failed to parse result data:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    } else if (router.isReady) {
      router.push('/');
    }
  }, [router.isReady, router.query]);

  const handleReport = async () => {
    if (!result) return;

    setReporting(true);
    try {
      await reportScam({
        message: result.originalMessage || '',
        url: result.url || '',
        scamScore: result.scamScore,
        riskLevel: result.riskLevel,
        flaggedKeywords: result.flaggedKeywords || [],
        flaggedUrls: result.flaggedUrls || [],
        explanation: result.explanation,
        messageHash: result.messageHash,
        reporterAddress: '0x0000000000000000000000000000000000000000' // Mock address
      });

      toast.success('Scam reported successfully to blockchain!');
    } catch (error) {
      console.error('Failed to report scam:', error);
      toast.error('Failed to report scam. Please try again.');
    } finally {
      setReporting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && result) {
      try {
        await navigator.share({
          title: 'ScamShield AI - Scan Result',
          text: `Scam Score: ${result.scamScore}% - ${result.riskLevel}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Share failed:', error);
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const text = `ScamShield AI Result:\nScam Score: ${result?.scamScore}%\nRisk Level: ${result?.riskLevel}\n${window.location.href}`;
    navigator.clipboard.writeText(text);
    toast.success('Result copied to clipboard!');
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'SCAM':
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
      case 'HIGH_RISK':
        return <AlertCircle className="w-8 h-8 text-orange-500" />;
      case 'SUSPICIOUS':
        return <AlertCircle className="w-8 h-8 text-yellow-500" />;
      case 'LOW_RISK':
        return <CheckCircle className="w-8 h-8 text-blue-500" />;
      default:
        return <CheckCircle className="w-8 h-8 text-green-500" />;
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'SCAM':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH_RISK':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'SUSPICIOUS':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW_RISK':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing message...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No scan results found</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Scan Results - ScamShield AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-4"
              >
                {getRiskIcon(result.riskLevel)}
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Scan Results</h1>
              <div className={`inline-flex items-center px-4 py-2 rounded-full border ${getRiskColor(result.riskLevel)}`}>
                <span className="font-semibold">{result.riskLevel.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Risk Meter */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Scam Probability</h2>
                <RiskMeter score={result.scamScore} />
                <div className="mt-4 text-center">
                  <span className="text-3xl font-bold text-gray-900">{result.scamScore}%</span>
                  <p className="text-gray-600 mt-1">chance this is a scam</p>
                </div>
              </div>
            </motion.div>

            {/* Analysis Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Details</h2>
              
              {result.explanation && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{result.explanation}</p>
                </div>
              )}

              {/* Flagged Keywords */}
              {result.flaggedKeywords && result.flaggedKeywords.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Suspicious Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.flaggedKeywords.map((keyword, index) => (
                      <KeywordHighlight key={index} keyword={keyword} />
                    ))}
                  </div>
                </div>
              )}

              {/* Flagged URLs */}
              {result.flaggedUrls && result.flaggedUrls.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Suspicious URLs</h3>
                  <div className="space-y-2">
                    {result.flaggedUrls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <span className="text-sm text-red-800 truncate flex-1">{url}</span>
                        <ExternalLink className="w-4 h-4 text-red-600 ml-2 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* URL Analysis */}
              {result.urlAnalysis && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">URL Analysis</h3>
                  <div className={`p-4 rounded-lg border ${
                    result.urlAnalysis.status === 'safe' ? 'bg-green-50 border-green-200' :
                    result.urlAnalysis.status === 'caution' ? 'bg-yellow-50 border-yellow-200' :
                    result.urlAnalysis.status === 'suspicious' ? 'bg-orange-50 border-orange-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <p className={`font-medium ${
                      result.urlAnalysis.status === 'safe' ? 'text-green-800' :
                      result.urlAnalysis.status === 'caution' ? 'text-yellow-800' :
                      result.urlAnalysis.status === 'suspicious' ? 'text-orange-800' :
                      'text-red-800'
                    }`}>
                      {result.urlAnalysis.message}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {result.scamScore >= 50 && (
                <button
                  onClick={handleReport}
                  disabled={reporting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Flag className="w-5 h-5" />
                  {reporting ? 'Reporting...' : 'Report as Scam'}
                </button>
              )}
              
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Share Results
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Shield className="w-5 h-5" />
                Scan Another
              </button>
            </motion.div>

            {/* Additional Info */}
            {result.blockchainConfirmed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800 font-medium">This scam has been confirmed on the blockchain</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
