import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Users, Lock } from 'lucide-react';
import ScamScanner from '@/components/ScamScanner';
import StatsCard from '@/components/StatsCard';
import RecentReports from '@/components/RecentReports';
import { fetchStats } from '@/utils/api';

export default function Home() {
  const [stats, setStats] = useState({
    totalReports: 0,
    averageScore: 0,
    highRiskCount: 0,
    blockchainConfirmed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await fetchStats();
        setStats(statsData.overall);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <>
      <Head>
        <title>ScamShield AI - AI-Powered Scam Detection</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-20 lg:py-32">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <motion.div
                  className="flex justify-center mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <Shield className="w-20 h-20 text-white" />
                </motion.div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                  ScamShield AI
                </h1>
                <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
                  Protect yourself from scams with AI-powered detection and blockchain-verified reporting
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Scanner Section */}
            <motion.div variants={itemVariants}>
              <ScamScanner />
            </motion.div>

            {/* Stats Section */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StatsCard
                  icon={TrendingUp}
                  title="Total Reports"
                  value={loading ? '...' : stats.totalReports}
                  color="blue"
                  description="Scams detected"
                />
                <StatsCard
                  icon={AlertTriangle}
                  title="Average Risk Score"
                  value={loading ? '...' : `${Math.round(stats.averageScore)}%`}
                  color="orange"
                  description="Threat level"
                />
                <StatsCard
                  icon={Users}
                  title="High Risk Reports"
                  value={loading ? '...' : stats.highRiskCount}
                  color="red"
                  description="Dangerous scams"
                />
                <StatsCard
                  icon={Lock}
                  title="Blockchain Verified"
                  value={loading ? '...' : stats.blockchainConfirmed}
                  color="green"
                  description="Immutable records"
                />
              </div>
            </motion.div>

            {/* Recent Reports */}
            <motion.div variants={itemVariants}>
              <RecentReports />
            </motion.div>

            {/* Features Section */}
            <motion.div variants={itemVariants} className="py-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  How ScamShield AI Protects You
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Our advanced AI analyzes messages and URLs for scam patterns, while blockchain technology ensures tamper-proof reporting
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Detection</h3>
                  <p className="text-gray-600">
                    Advanced machine learning models analyze text patterns, URLs, and phishing attempts in real-time
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Blockchain Registry</h3>
                  <p className="text-gray-600">
                    All scam reports are permanently stored on the blockchain, creating a tamper-proof public registry
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Protection</h3>
                  <p className="text-gray-600">
                    Users contribute to a growing database of verified scams, protecting the entire community
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
