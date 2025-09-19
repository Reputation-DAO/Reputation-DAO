/**
 * Utility functions for parsing blockchain transaction data
 */

/**
 * Parse transaction type from backend variant type
 * Backend uses: { 'Award': null } | { 'Revoke': null } | { 'Decay': null }
 */
export const parseTransactionType = (transactionType: any): 'award' | 'revoke' | 'decay' => {
  console.log('🔍 COMPREHENSIVE PARSING - Input:', transactionType);
  console.log('🔍 COMPREHENSIVE PARSING - Type:', typeof transactionType);
  console.log('🔍 COMPREHENSIVE PARSING - JSON:', JSON.stringify(transactionType));
  
  if (!transactionType) {
    console.warn('⚠️ Transaction type is null/undefined:', transactionType);
    return 'award'; // Default fallback
  }

  // Handle string case
  if (typeof transactionType === 'string') {
    console.log('📝 Transaction type is string:', transactionType);
    const lowerType = transactionType.toLowerCase();
    if (lowerType.includes('award')) return 'award';
    if (lowerType.includes('revoke')) return 'revoke';
    if (lowerType.includes('decay')) return 'decay';
    return 'award';
  }

  if (typeof transactionType !== 'object') {
    console.warn('⚠️ Transaction type is not an object:', transactionType, 'Type:', typeof transactionType);
    return 'award'; // Default fallback
  }

  const keys = Object.keys(transactionType);
  console.log('🔍 Transaction type keys:', keys, 'Length:', keys.length);
  
  if (keys.length === 0) {
    console.warn('⚠️ Transaction type has no keys:', transactionType);
    return 'award';
  }
  
  // Check each key individually
  for (const key of keys) {
    console.log('🔍 Checking key:', key, 'Value:', transactionType[key]);
    
    // Exact match (case sensitive)
    if (key === 'Award') {
      console.log('✅ EXACT MATCH: Award');
      return 'award';
    }
    if (key === 'Revoke') {
      console.log('✅ EXACT MATCH: Revoke');
      return 'revoke';
    }
    if (key === 'Decay') {
      console.log('✅ EXACT MATCH: Decay');
      return 'decay';
    }
    
    // Case insensitive match
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'award') {
      console.log('✅ CASE INSENSITIVE MATCH: Award');
      return 'award';
    }
    if (lowerKey === 'revoke') {
      console.log('✅ CASE INSENSITIVE MATCH: Revoke');
      return 'revoke';
    }
    if (lowerKey === 'decay') {
      console.log('✅ CASE INSENSITIVE MATCH: Decay');
      return 'decay';
    }
  }
  
  console.warn('⚠️ NO MATCH FOUND - Keys:', keys, 'Defaulting to award');
  return 'award';
};

/**
 * Alternative parsing method for transaction types
 * This handles different possible data structures from the backend
 */
export const parseTransactionTypeAlternative = (transactionType: any): 'award' | 'revoke' | 'decay' => {
  console.log('🔍 Alternative parsing for transaction type:', transactionType);
  
  if (!transactionType) {
    return 'award';
  }

  // Handle string types
  if (typeof transactionType === 'string') {
    const lowerType = transactionType.toLowerCase();
    if (lowerType.includes('award')) return 'award';
    if (lowerType.includes('revoke')) return 'revoke';
    if (lowerType.includes('decay')) return 'decay';
    return 'award';
  }

  // Handle object types
  if (typeof transactionType === 'object') {
    const keys = Object.keys(transactionType);
    
    // Try direct property access
    if ('Award' in transactionType) return 'award';
    if ('Revoke' in transactionType) return 'revoke';
    if ('Decay' in transactionType) return 'decay';
    
    // Try case variations
    if ('award' in transactionType) return 'award';
    if ('revoke' in transactionType) return 'revoke';
    if ('decay' in transactionType) return 'decay';
    
    // Check keys
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'award') return 'award';
      if (lowerKey === 'revoke') return 'revoke';
      if (lowerKey === 'decay') return 'decay';
    }
  }
  
  return 'award';
};

/**
 * Parse transaction type for UI display (Dashboard activity)
 */
export const parseTransactionTypeForUI = (transactionType: any): 'awarded' | 'revoked' | 'decayed' => {
  // Try primary parsing method first
  let type = parseTransactionType(transactionType);
  
  // If primary method fails, try alternative method
  if (type === 'award' && transactionType) {
    const altType = parseTransactionTypeAlternative(transactionType);
    if (altType !== 'award') {
      console.log('🔄 Using alternative parsing method, result:', altType);
      type = altType;
    }
  }
  
  // Additional fallback: if still 'award', try to determine from amount or other clues
  if (type === 'award' && transactionType) {
    console.log('🔍 Final fallback check for transaction type:', transactionType);
    // This is a last resort - in most cases the parsing should work
  }
  
  switch (type) {
    case 'award':
      return 'awarded';
    case 'revoke':
      return 'revoked';
    case 'decay':
      return 'decayed'; // Fixed: now properly shows 'decayed' instead of 'earned'
    default:
      console.warn('⚠️ Unknown transaction type, defaulting to awarded:', type);
      return 'awarded';
  }
};

/**
 * Get transaction type icon class
 */
export const getTransactionTypeIcon = (type: 'award' | 'revoke' | 'decay'): string => {
  switch (type) {
    case 'award':
      return 'w-8 h-8 rounded-full bg-green-100 flex items-center justify-center';
    case 'revoke':
      return 'w-8 h-8 rounded-full bg-red-100 flex items-center justify-center';
    case 'decay':
      return 'w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center';
    default:
      return 'w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center';
  }
};

/**
 * Get transaction type background class
 */
export const getTransactionTypeBgClass = (type: 'award' | 'revoke' | 'decay'): string => {
  switch (type) {
    case 'award':
      return 'bg-green-50 border-green-200';
    case 'revoke':
      return 'bg-red-50 border-red-200';
    case 'decay':
      return 'bg-orange-50 border-orange-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

/**
 * Format transaction amount with appropriate sign
 */
export const formatTransactionAmount = (type: 'award' | 'revoke' | 'decay', amount: number): string => {
  switch (type) {
    case 'award':
      return `+${amount}`;
    case 'revoke':
    case 'decay':
      return `-${amount}`;
    default:
      return `${amount}`;
  }
};

/**
 * Convert timestamp from backend to Date object
 */
export const convertTimestampToDate = (timestamp: bigint | number): Date => {
  // Convert to number if it's a BigInt
  const timestampNum = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  
  console.log('🕐 Converting timestamp:', {
    original: timestamp,
    type: typeof timestamp,
    asNumber: timestampNum,
    asString: timestampNum.toString()
  });
  
  // Try different timestamp formats
  let milliseconds = timestampNum;
  
  // If the timestamp is very small (like 1758), it might be in seconds
  if (timestampNum < 1000000000) { // Less than year 2001 in seconds
    console.log('🕐 Timestamp appears to be in seconds, converting to milliseconds');
    milliseconds = timestampNum * 1000;
  }
  // If the timestamp is very large (like 1703123456789000000), it might be in nanoseconds
  else if (timestampNum > 1000000000000) { // More than year 2001 in milliseconds
    console.log('🕐 Timestamp appears to be in nanoseconds, converting to milliseconds');
    milliseconds = timestampNum / 1000000;
  }
  // Otherwise, assume it's already in milliseconds
  else {
    console.log('🕐 Timestamp appears to be in milliseconds, using as-is');
    milliseconds = timestampNum;
  }
  
  console.log('🕐 Final milliseconds:', milliseconds);
  
  const date = new Date(milliseconds);
  console.log('🕐 Final date:', date.toISOString());
  
  return date;
};

/**
 * Get transaction type description
 */
export const getTransactionTypeDescription = (type: 'award' | 'revoke' | 'decay'): string => {
  switch (type) {
    case 'award':
      return 'Reputation Awarded';
    case 'revoke':
      return 'Reputation Revoked';
    case 'decay':
      return 'Reputation Decayed';
    default:
      return 'Transaction';
  }
};

/**
 * Get transaction type icon name for Lucide icons
 */
export const getTransactionTypeIconName = (type: 'award' | 'revoke' | 'decay'): string => {
  switch (type) {
    case 'award':
      return 'TrendingUp';
    case 'revoke':
      return 'TrendingDown';
    case 'decay':
      return 'Clock';
    default:
      return 'Circle';
  }
};

/**
 * Extract reason from backend reason array
 * Backend uses: [] | [string] format
 */
export const extractReason = (reasonArray: [] | [string]): string => {
  if (reasonArray.length > 0 && reasonArray[0]) {
    return reasonArray[0];
  }
  return "No reason provided";
};