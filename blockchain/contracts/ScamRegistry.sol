// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title ScamRegistry
 * @dev Immutable blockchain registry for scam reports
 * @notice Stores verified scam reports with tamper-proof storage
 */
contract ScamRegistry is Ownable, ReentrancyGuard, Pausable {
    
    struct ScamReport {
        string messageHash;        // SHA256 hash of the message
        string url;               // Suspicious URL (if any)
        uint256 scamScore;        // Scam probability (0-100)
        uint256 timestamp;        // Report timestamp
        address reporter;         // Address of the reporter
        uint256 reportCount;      // Number of times this scam has been reported
        bool isActive;           // Report status
    }
    
    // Mapping from message hash to scam report
    mapping(string => ScamReport) public scamReports;
    
    // Array of all reported message hashes for enumeration
    string[] public messageHashes;
    
    // Mapping to track if a hash has been reported before
    mapping(string => bool) private hasReported;
    
    // Events
    event ScamReported(
        string indexed messageHash,
        string url,
        uint256 scamScore,
        address indexed reporter,
        uint256 timestamp
    );
    
    event ReportUpdated(
        string indexed messageHash,
        uint256 newScore,
        uint256 newReportCount,
        address indexed reporter
    );
    
    event ReportStatusChanged(
        string indexed messageHash,
        bool isActive
    );
    
    // Constants
    uint256 public constant MIN_SCORE_THRESHOLD = 50; // Minimum score to be considered a scam
    uint256 public constant MAX_REPORTS_PER_HASH = 100; // Maximum reports per hash to prevent spam
    
    constructor() {
        // Contract deployment logic
    }
    
    /**
     * @dev Report a scam message or URL
     * @param messageHash SHA256 hash of the message content
     * @param url Suspicious URL (empty string if no URL)
     * @param scamScore Scam probability score (0-100)
     */
    function reportScam(
        string memory messageHash,
        string memory url,
        uint256 scamScore
    ) external nonReentrant whenNotPaused {
        require(bytes(messageHash).length > 0, "Message hash cannot be empty");
        require(scamScore <= 100, "Score must be between 0 and 100");
        require(scamScore >= MIN_SCORE_THRESHOLD, "Score below scam threshold");
        
        if (!hasReported[messageHash]) {
            // New report
            scamReports[messageHash] = ScamReport({
                messageHash: messageHash,
                url: url,
                scamScore: scamScore,
                timestamp: block.timestamp,
                reporter: msg.sender,
                reportCount: 1,
                isActive: true
            });
            
            messageHashes.push(messageHash);
            hasReported[messageHash] = true;
            
            emit ScamReported(messageHash, url, scamScore, msg.sender, block.timestamp);
        } else {
            // Update existing report
            ScamReport storage existingReport = scamReports[messageHash];
            require(existingReport.reportCount < MAX_REPORTS_PER_HASH, "Maximum reports reached");
            
            // Calculate weighted average score
            uint256 totalScore = existingReport.scamScore * existingReport.reportCount + scamScore;
            existingReport.reportCount++;
            existingReport.scamScore = totalScore / existingReport.reportCount;
            existingReport.timestamp = block.timestamp;
            
            emit ReportUpdated(messageHash, existingReport.scamScore, existingReport.reportCount, msg.sender);
        }
    }
    
    /**
     * @dev Get scam report by message hash
     * @param messageHash The hash of the message
     * @return The scam report details
     */
    function getScamReport(string memory messageHash) external view returns (ScamReport memory) {
        return scamReports[messageHash];
    }
    
    /**
     * @dev Get all scam reports
     * @return Array of all scam reports
     */
    function getAllScamReports() external view returns (ScamReport[] memory) {
        uint256 length = messageHashes.length;
        ScamReport[] memory reports = new ScamReport[](length);
        
        for (uint256 i = 0; i < length; i++) {
            reports[i] = scamReports[messageHashes[i]];
        }
        
        return reports;
    }
    
    /**
     * @dev Check if a message hash has been reported
     * @param messageHash The hash to check
     * @return True if reported, false otherwise
     */
    function isReported(string memory messageHash) external view returns (bool) {
        return hasReported[messageHash];
    }
    
    /**
     * @dev Get the total number of reported scams
     * @return Total count of reported scams
     */
    function getTotalReports() external view returns (uint256) {
        return messageHashes.length;
    }
    
    /**
     * @dev Get recent scam reports (last 10)
     * @return Array of recent scam reports
     */
    function getRecentReports() external view returns (ScamReport[] memory) {
        uint256 length = messageHashes.length;
        uint256 recentCount = length > 10 ? 10 : length;
        ScamReport[] memory reports = new ScamReport[](recentCount);
        
        for (uint256 i = 0; i < recentCount; i++) {
            uint256 index = length - recentCount + i;
            reports[i] = scamReports[messageHashes[index]];
        }
        
        return reports;
    }
    
    /**
     * @dev Get scam statistics
     * @return totalReports Total number of reports
     * @return averageScore Average scam score across all reports
     * @return highRiskCount Number of high-risk reports (score >= 80)
     */
    function getScamStatistics() external view returns (
        uint256 totalReports,
        uint256 averageScore,
        uint256 highRiskCount
    ) {
        totalReports = messageHashes.length;
        uint256 totalScore = 0;
        highRiskCount = 0;
        
        for (uint256 i = 0; i < totalReports; i++) {
            ScamReport memory report = scamReports[messageHashes[i]];
            totalScore += report.scamScore;
            if (report.scamScore >= 80) {
                highRiskCount++;
            }
        }
        
        averageScore = totalReports > 0 ? totalScore / totalReports : 0;
    }
    
    /**
     * @dev Pause contract operations (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract operations (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Deactivate a report (only owner)
     * @param messageHash The hash of the report to deactivate
     */
    function deactivateReport(string memory messageHash) external onlyOwner {
        require(hasReported[messageHash], "Report not found");
        scamReports[messageHash].isActive = false;
        emit ReportStatusChanged(messageHash, false);
    }
    
    /**
     * @dev Reactivate a report (only owner)
     * @param messageHash The hash of the report to reactivate
     */
    function reactivateReport(string memory messageHash) external onlyOwner {
        require(hasReported[messageHash], "Report not found");
        scamReports[messageHash].isActive = true;
        emit ReportStatusChanged(messageHash, true);
    }
}
