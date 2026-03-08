import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { fetchReports } from '@/utils/api';

export default function RecentReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await fetchReports({ page: 1, limit: 5 });
        setReports(data.data || []);
      } catch (error) {
        console.error('Failed to load recent reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'SCAM':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH_RISK':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'SUSPICIOUS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW_RISK':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Scam Reports</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Latest reports</span>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No scam reports yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report, index) => (
            <motion.div
              key={report._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(report.riskLevel)}`}>
                    {report.riskLevel.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-600">
                    {Math.round(report.scamScore)}% risk
                  </span>
                  {report.blockchain?.confirmed && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="truncate max-w-xs">
                    {report.url ? (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {report.url}
                      </span>
                    ) : (
                      'Message only'
                    )}
                  </span>
                  <span>{formatDate(report.createdAt)}</span>
                  {report.reportCount > 1 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {report.reportCount} reports
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
