// Test Old MongoDB Credentials Against New Database
const mongoose = require('mongoose');
require('dotenv').config();

const OLD_CREDENTIALS = {
    username: 'i200821_db_user',
    password: '80dc9I3zQmbFEF4Y',
    cluster: 'myrentaladmin.wsvp54a.mongodb.net',
    database: 'myrental_marketplace'
};

const NEW_CREDENTIALS = {
    username: 'RentEasy_Db',
    password: 'Z6D25KQGdZ6XYbvP',
    cluster: 'renteasy.pnw4beh.mongodb.net',
    database: 'myrental_marketplace'
};

async function testCredentials(credentials, label) {
    const uri = `mongodb+srv://${credentials.username}:${credentials.password}@${credentials.cluster}/${credentials.database}?retryWrites=true&w=majority`;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing ${label}:`);
    console.log(`Username: ${credentials.username}`);
    console.log(`Cluster: ${credentials.cluster}`);
    console.log(`Database: ${credentials.database}`);
    console.log(`${'='.repeat(60)}\n`);
    
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 5000
        });
        
        console.log(`✅ ${label} - Connection SUCCESSFUL`);
        console.log(`   Connected to: ${mongoose.connection.host}`);
        console.log(`   Database: ${mongoose.connection.name}`);
        
        // Test a simple query
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`   Collections found: ${collections.length}`);
        
        await mongoose.connection.close();
        return true;
    } catch (error) {
        console.log(`❌ ${label} - Connection FAILED`);
        console.log(`   Error: ${error.message}`);
        if (error.message.includes('authentication')) {
            console.log(`   Reason: Authentication failed - username/password incorrect`);
        } else if (error.message.includes('timeout')) {
            console.log(`   Reason: Connection timeout - cluster may not exist or network issue`);
        }
        return false;
    }
}

async function main() {
    console.log('\n🔍 Testing MongoDB Credentials\n');
    
    // Test new credentials (should work)
    const newWorks = await testCredentials(NEW_CREDENTIALS, 'NEW Credentials (Current)');
    
    // Test old credentials (may or may not work)
    const oldWorks = await testCredentials(OLD_CREDENTIALS, 'OLD Credentials (Previous)');
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('SUMMARY:');
    console.log(`${'='.repeat(60)}`);
    console.log(`New Credentials (RentEasy_Db): ${newWorks ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Old Credentials (i200821_db_user): ${oldWorks ? '✅ WORKING' : '❌ FAILED'}`);
    
    if (oldWorks) {
        console.log('\n⚠️  WARNING: Old credentials still work on the new database!');
        console.log('   This means the old user may still exist in MongoDB Atlas.');
        console.log('   Recommendation: Delete the old user from MongoDB Atlas for security.');
    } else {
        console.log('\n✅ Good: Old credentials do NOT work on the new database.');
        console.log('   This means the old user has been removed or credentials changed.');
    }
    
    console.log(`\n${'='.repeat(60)}\n`);
    
    process.exit(0);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});


