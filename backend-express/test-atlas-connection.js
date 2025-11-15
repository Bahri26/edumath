/**
 * Atlas Connection Diagnostic Tool
 * 
 * Tests various connection string formats to identify the issue
 */

const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async (uri, label) => {
  console.log(`\n[${label}] Testing connection...`);
  console.log(`URI: ${uri.replace(/:[^:@]+@/, ':****@')}`); // Hide password
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    
    console.log(`✓ SUCCESS: ${label} connected!`);
    
    // Test query
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.ping();
    console.log(`✓ Ping result:`, result);
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log(`✗ FAILED: ${label}`);
    console.log(`  Error: ${error.message}`);
    if (error.code) console.log(`  Code: ${error.code}`);
    await mongoose.disconnect();
    return false;
  }
};

const runTests = async () => {
  console.log('=== MongoDB Atlas Connection Diagnostic ===\n');
  
  const originalUri = process.env.MONGO_URI;
  console.log('Original MONGO_URI from .env:', originalUri ? 'Found' : 'NOT FOUND');
  
  if (!originalUri) {
    console.error('ERROR: MONGO_URI not found in .env file!');
    process.exit(1);
  }
  
  // Test 1: Original connection string
  const success1 = await testConnection(originalUri, 'Original URI from .env');
  
  if (!success1) {
    console.log('\n=== Troubleshooting Tips ===');
    console.log('1. Verify cluster hostname in Atlas dashboard (Connect > Drivers)');
    console.log('2. Check Network Access whitelist includes your IP or 0.0.0.0/0');
    console.log('3. Verify database user credentials are correct');
    console.log('4. Wait 1-2 minutes if cluster was just created (DNS propagation)');
    console.log('5. Try the standard connection string format instead of mongodb+srv://');
    console.log('\nTo get correct connection string:');
    console.log('  - Go to Atlas Dashboard > Clusters');
    console.log('  - Click "Connect" button on your cluster');
    console.log('  - Choose "Connect your application"');
    console.log('  - Copy the connection string and update .env');
  }
  
  console.log('\n=== Diagnostic Complete ===');
  process.exit(success1 ? 0 : 1);
};

runTests();
