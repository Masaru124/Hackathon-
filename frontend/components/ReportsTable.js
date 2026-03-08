import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ExternalLink, Clock, Hash, Shield } from 'lucide-react';

export default function ReportsTable({ reports }) {
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedReports = [...reports].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'createdAt') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

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
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateHash = (hash) => {
    return hash ? `${hash.slice(0, 8)}...${hash.slice(-8)}` : 'N/A';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-900">
              <button
                onClick={() => handleSort('createdAt')}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                <Clock className="w-4 h-4" />
                Date
                {sortField === 'createdAt' && (
                  <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">
              <button
                onClick={() => handleSort('riskLevel')}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                <AlertTriangle className="w-4 h-4" />
                Risk Level
                {sortField === 'riskLevel' && (
                  <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">
              <button
                onClick={() => handleSort('scamScore')}
                className="flex items-center gap-1 hover:text-blue-600"
              >
                Score
                {sortField === 'scamScore' && (
                  <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">URL</th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">
              <Hash className="w-4 h-4" />
              Hash
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-900">
              <Shield className="w-4 h-4" />
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedReports.map((report, index) => (
            <motion.tr
              key={report._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="py-3 px-4">
                <div className="text-sm text-gray-900">
                  {formatDate(report.createdAt)}
                </div>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(report.riskLevel)}`}>
                  {report.riskLevel.replace('_', ' ')}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-gray-900">
                    {Math.round(report.scamScore)}%
                  </div>
                  <div className="w-12 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        report.scamScore >= 80 ? 'bg-red-500' :
                        report.scamScore >= 60 ? 'bg-orange-500' :
                        report.scamScore >= 40 ? 'bg-yellow-500' :
                        report.scamScore >= 20 ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${report.scamScore}%` }}
                    ></div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                {report.url ? (
                  <div className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate max-w-xs">{report.url}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">No URL</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="text-sm font-mono text-gray-600">
                  {truncateHash(report.messageHash)}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {report.blockchain?.confirmed ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Verified
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Pending
                    </span>
                  )}
                  {report.reportCount > 1 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {report.reportCount}x
                    </span>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      
      {reports.length === 0 && (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No reports found</p>
        </div>
      )}
    </div>
  );
}
