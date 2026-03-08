from web3 import Web3
from web3.exceptions import TransactionNotFound
import json
import logging
from typing import Dict, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class BlockchainService:
    """Blockchain service for scam registry operations"""
    
    def __init__(self):
        self.w3 = None
        self.contract = None
        self.contract_abi = None
        self.contract_address = settings.CONTRACT_ADDRESS
        self.private_key = settings.PRIVATE_KEY
        
        # Load contract ABI
        self.load_contract_abi()
        
        # Initialize Web3 connection
        self.initialize_connection()

    def load_contract_abi(self):
        """Load contract ABI from file"""
        try:
            abi_path = "../blockchain/contract-info.json"
            with open(abi_path, 'r') as f:
                contract_info = json.load(f)
                self.contract_abi = contract_info['abi']
                if not self.contract_address:
                    self.contract_address = contract_info.get('address')
            
            logger.info("📋 Contract ABI loaded successfully")
            
        except Exception as e:
            logger.warning(f"⚠️ Could not load contract ABI: {e}")
            # Use fallback ABI (basic structure)
            self.contract_abi = [
                {
                    "inputs": [
                        {"name": "messageHash", "type": "string"},
                        {"name": "url", "type": "string"},
                        {"name": "scamScore", "type": "uint256"}
                    ],
                    "name": "reportScam",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "inputs": [{"name": "messageHash", "type": "string"}],
                    "name": "getScamReport",
                    "outputs": [{"components": [
                        {"name": "messageHash", "type": "string"},
                        {"name": "url", "type": "string"},
                        {"name": "scamScore", "type": "uint256"},
                        {"name": "timestamp", "type": "uint256"},
                        {"name": "reporter", "type": "address"},
                        {"name": "reportCount", "type": "uint256"},
                        {"name": "isActive", "type": "bool"}
                    ], "name": "", "type": "tuple"}],
                    "stateMutability": "view",
                    "type": "function"
                }
            ]

    def initialize_connection(self):
        """Initialize Web3 connection"""
        try:
            if not settings.BLOCKCHAIN_RPC_URL:
                logger.warning("⚠️ No blockchain RPC URL configured")
                return
            
            self.w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
            
            # Add middleware for testnet
            if "mumbai" in settings.BLOCKCHAIN_RPC_URL:
                # Skip POA middleware for newer web3 versions
                pass
            
            # Test connection
            if self.w3.is_connected():
                logger.info("⛓️ Connected to blockchain")
                
                # Initialize contract if address is available
                if self.contract_address and self.contract_abi:
                    self.contract = self.w3.eth.contract(
                        address=self.contract_address,
                        abi=self.contract_abi
                    )
                    logger.info(f"📋 Contract initialized at {self.contract_address}")
            else:
                logger.warning("⚠️ Failed to connect to blockchain")
                
        except Exception as e:
            logger.error(f"❌ Blockchain connection failed: {e}")

    async def get_status(self) -> Dict:
        """Get blockchain connection status"""
        if not self.w3:
            return {
                'connected': False,
                'error': 'Not initialized',
                'mock': True
            }
        
        try:
            if not self.w3.is_connected():
                return {
                    'connected': False,
                    'error': 'Connection failed',
                    'mock': True
                }
            
            # Get network info
            network = self.w3.eth.chain_id
            block_number = self.w3.eth.block_number
            
            status = {
                'connected': True,
                'network': {
                    'name': 'Polygon Testnet' if network == 80001 else f'Chain {network}',
                    'chainId': network
                },
                'blockNumber': block_number,
                'contract': {
                    'address': self.contract_address,
                    'status': 'loaded' if self.contract else 'not_loaded'
                }
            }
            
            # Add wallet info if private key is available
            if self.private_key:
                try:
                    account = self.w3.eth.account.from_key(self.private_key)
                    balance = self.w3.eth.get_balance(account.address)
                    status['wallet'] = {
                        'address': account.address,
                        'balance': self.w3.from_wei(balance, 'ether')
                    }
                except Exception as e:
                    logger.warning(f"⚠️ Wallet info unavailable: {e}")
            
            return status
            
        except Exception as e:
            logger.error(f"❌ Status check failed: {e}")
            return {
                'connected': False,
                'error': str(e),
                'mock': True
            }

    async def report_scam(self, message_hash: str, url: str, scam_score: int) -> str:
        """Report scam to blockchain"""
        if not self.contract or not self.w3:
            logger.warning("⚠️ Blockchain not available, using mock")
            return f"0xmock_tx_hash_{message_hash[:8]}"
        
        try:
            if not self.private_key:
                raise ValueError("Private key not configured for blockchain transactions")
            
            # Prepare transaction
            account = self.w3.eth.account.from_key(self.private_key)
            
            # Get nonce
            nonce = self.w3.eth.get_transaction_count(account.address)
            
            # Build transaction
            transaction = self.contract.functions.reportScam(
                message_hash,
                url or "",
                scam_score
            ).build_transaction({
                'from': account.address,
                'nonce': nonce,
                'gas': 200000,  # Estimate gas
                'gasPrice': self.w3.eth.gas_price,
                'chainId': self.w3.eth.chain_id
            })
            
            # Sign transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.private_key)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for confirmation
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if tx_receipt.status == 1:
                logger.info(f"✅ Scam reported to blockchain: {tx_hash.hex()}")
                return tx_hash.hex()
            else:
                raise Exception("Transaction failed")
                
        except Exception as e:
            logger.error(f"❌ Failed to report scam to blockchain: {e}")
            # Return mock transaction hash for demo purposes
            return f"0xmock_tx_hash_{message_hash[:8]}"

    async def get_scam_report(self, message_hash: str) -> Optional[Dict]:
        """Get scam report from blockchain"""
        if not self.contract or not self.w3:
            return None
        
        try:
            report = self.contract.functions.getScamReport(message_hash).call()
            
            return {
                'messageHash': report[0],
                'url': report[1],
                'scamScore': report[2],
                'timestamp': report[3],
                'reporter': report[4],
                'reportCount': report[5],
                'isActive': report[6]
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get scam report: {e}")
            return None

    async def get_all_reports(self, limit: int = 50) -> List[Dict]:
        """Get all scam reports from blockchain"""
        if not self.contract or not self.w3:
            return []
        
        try:
            reports = self.contract.functions.getAllScamReports().call()
            
            # Convert to dict format and limit results
            result = []
            for report in reports[:limit]:
                result.append({
                    'messageHash': report[0],
                    'url': report[1],
                    'scamScore': report[2],
                    'timestamp': report[3],
                    'reporter': report[4],
                    'reportCount': report[5],
                    'isActive': report[6]
                })
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Failed to get all reports: {e}")
            return []

    async def get_statistics(self) -> Dict:
        """Get blockchain statistics"""
        if not self.contract or not self.w3:
            return {
                'totalReports': '0',
                'averageScore': '0',
                'highRiskCount': '0'
            }
        
        try:
            stats = self.contract.functions.getScamStatistics().call()
            
            return {
                'totalReports': str(stats[0]),
                'averageScore': str(stats[1]),
                'highRiskCount': str(stats[2])
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get statistics: {e}")
            return {
                'totalReports': '0',
                'averageScore': '0',
                'highRiskCount': '0'
            }

    async def is_reported(self, message_hash: str) -> bool:
        """Check if message hash is already reported"""
        if not self.contract or not self.w3:
            return False
        
        try:
            return self.contract.functions.isReported(message_hash).call()
        except Exception as e:
            logger.error(f"❌ Failed to check if reported: {e}")
            return False

    def get_mock_data(self) -> Dict:
        """Get mock data for development when blockchain is not available"""
        return {
            'status': {
                'connected': False,
                'mock': True,
                'message': 'Using mock data for development'
            },
            'reports': [
                {
                    'messageHash': '0x1234567890abcdef',
                    'url': 'http://fake-scam-site.com',
                    'scamScore': 85,
                    'timestamp': 1640995200,
                    'reporter': '0xabcdef1234567890',
                    'reportCount': 3,
                    'isActive': True
                }
            ],
            'statistics': {
                'totalReports': '150',
                'averageScore': '72',
                'highRiskCount': '45'
            }
        }
