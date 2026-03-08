const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ScamRegistry contract...");
  
  // Get the contract factory
  const ScamRegistry = await ethers.getContractFactory("ScamRegistry");
  
  // Deploy the contract
  const scamRegistry = await ScamRegistry.deploy();
  
  // Wait for deployment to complete
  await scamRegistry.deployed();
  
  console.log("✅ ScamRegistry deployed to:", scamRegistry.address);
  console.log("📄 Transaction hash:", scamRegistry.deployTransaction.hash);
  
  // Save contract address and ABI to a file for frontend use
  const fs = require("fs");
  const contractInfo = {
    address: scamRegistry.address,
    abi: require("../artifacts/contracts/ScamRegistry.sol/ScamRegistry.json").abi,
    network: network.name
  };
  
  fs.writeFileSync(
    "../frontend/contract-info.json", 
    JSON.stringify(contractInfo, null, 2)
  );
  
  fs.writeFileSync(
    "../backend/contract-info.json", 
    JSON.stringify(contractInfo, null, 2)
  );
  
  console.log("📝 Contract info saved to frontend and backend");
  
  // Test the contract with a sample report
  console.log("🧪 Testing contract with sample report...");
  const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Test scam message"));
  const url = "http://fake-scam-site.com";
  const scamScore = 85;
  
  const tx = await scamRegistry.reportScam(messageHash, url, scamScore);
  await tx.wait();
  
  console.log("✅ Sample report added successfully");
  
  // Verify the report
  const report = await scamRegistry.getScamReport(messageHash);
  console.log("📊 Report details:", {
    messageHash: report.messageHash,
    url: report.url,
    scamScore: report.scamScore.toString(),
    reportCount: report.reportCount.toString(),
    isActive: report.isActive
  });
  
  console.log("🎉 Deployment and testing complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
