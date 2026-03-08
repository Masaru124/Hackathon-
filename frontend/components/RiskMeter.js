import { motion } from 'framer-motion';

export default function RiskMeter({ score }) {
  const getColor = (score) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getTextColor = (score) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-blue-600';
    return 'text-green-600';
  };

  const getRiskLabel = (score) => {
    if (score >= 80) return 'Extremely High Risk';
    if (score >= 60) return 'High Risk';
    if (score >= 40) return 'Medium Risk';
    if (score >= 20) return 'Low Risk';
    return 'Very Low Risk';
  };

  return (
    <div className="space-y-4">
      {/* Risk Label */}
      <div className="text-center">
        <p className={`text-lg font-semibold ${getTextColor(score)}`}>
          {getRiskLabel(score)}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${getColor(score)} relative`}
          >
            <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse"></div>
          </motion.div>
        </div>
        
        {/* Scale Markers */}
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Risk Levels */}
      <div className="flex justify-between text-xs">
        <div className="text-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
          <span className="text-gray-600">Safe</span>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-1"></div>
          <span className="text-gray-600">Low</span>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-1"></div>
          <span className="text-gray-600">Medium</span>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto mb-1"></div>
          <span className="text-gray-600">High</span>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
          <span className="text-gray-600">Scam</span>
        </div>
      </div>
    </div>
  );
}
