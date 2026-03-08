import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, TrendingUp, Users, Globe, Clock, Hash, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchStats, fetchReports } from '@/utils/api';
import StatsCard from '@/components/StatsCard';
import ReportsTable from '@/components/ReportsTable';
import TrendChart from '@/components/TrendChart';

export default function Dashboard() {
  const [stats, setStats] = useState({
    overall: { totalReports: 0, averageScore: 0, highRiskCount: 0, confirmedCount: 0 },
    byCategory: [],
    recentTrend: []
  });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, reportsData] = await Promise.all([
          fetchStats(),
          fetchReports({ page: 1, limit: 20 })
        ]);

        setStats(statsData);
        setReports(reportsData.data || []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - ScamShield AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">ScamShield Dashboard</h1>
              <p className="text-lg text-gray-600">Real-time scam detection and blockchain registry insights</p>
            </motion.div>

            {/* Navigation Tabs */}
            <motion.div variants={itemVariants}>
              <div className="bg-white rounded-lg shadow-md p-1 flex space-x-1">
                {['overview', 'reports', 'trends'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div variants={itemVariants} className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard
                    icon={TrendingUp}
                    title="Total Reports"
                    value={stats.overall.totalReports}
                    color="blue"
                    description="Scams detected"
                  />
                  <StatsCard
                    icon={AlertTriangle}
                    title="Average Risk Score"
                    value={`${Math.round(stats.overall.averageScore)}%`}
                    color="orange"
                    description="Threat level"
                  />
                  <StatsCard
                    icon={Users}
                    title="High Risk Reports"
                    value={stats.overall.highRiskCount}
                    color="red"
                    description="Dangerous scams"
                  />
                  <StatsCard
                    icon={Shield}
                    title="Blockchain Verified"
                    value={stats.overall.confirmedCount}
                    color="green"
                    description="Immutable records"
                  />
                </div>

                {/* Category Breakdown */}
                {stats.byCategory.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Scam Categories</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.byCategory.map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 capitalize">
                              {category._id.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-gray-600">{category.count} reports</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              {Math.round(category.avgScore)}%
                            </p>
                            <p className="text-xs text-gray-600">avg score</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Trend */}
                {stats.recentTrend.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">7-Day Trend</h2>
                    <TrendChart data={stats.recentTrend} />
                  </div>
                )}
              </motion.div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Scam Reports</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Last 20 reports</span>
                    </div>
                  </div>
                  <ReportsTable reports={reports} />
                </div>
              </motion.div>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <motion.div variants={itemVariants} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Reports Trend</h2>
                    <TrendChart data={stats.recentTrend} height={300} />
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Categories</h2>
                    <div className="space-y-3">
                      {stats.byCategory.slice(0, 5).map((category, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                            </div>
                            <span className="font-medium text-gray-900 capitalize">
                              {category._id.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{category.count}</p>
                              <p className="text-xs text-gray-600">reports</p>
                            </div>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(100, (category.count / Math.max(...stats.byCategory.map(c => c.count))) * 100)}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Blockchain Stats */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Blockchain Registry</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Hash className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{stats.overall.confirmedCount}</p>
                      <p className="text-sm text-gray-600">Confirmed Transactions</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Globe className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">Polygon Testnet</p>
                      <p className="text-sm text-gray-600">Blockchain Network</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-6 h-6 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">Immutable</p>
                      <p className="text-sm text-gray-600">Tamper-Proof Records</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
