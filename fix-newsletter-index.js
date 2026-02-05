/**
 * Fix Newsletter Index - Remove duplicate key error on mobile field
 * This script drops and recreates the mobile index with sparse: true
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixNewsletterIndex() {
    try {
        console.log('🔧 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('newsletters');

        console.log('\n📋 Current indexes:');
        const indexes = await collection.indexes();
        indexes.forEach(index => {
            console.log(`   - ${JSON.stringify(index)}`);
        });

        // Drop the mobile index if it exists
        console.log('\n🗑️  Dropping mobile_1 index...');
        try {
            await collection.dropIndex('mobile_1');
            console.log('✅ mobile_1 index dropped');
        } catch (error) {
            if (error.code === 27) {
                console.log('⚠️  Index mobile_1 does not exist, skipping...');
            } else {
                throw error;
            }
        }

        // Drop the email index if it exists
        console.log('\n🗑️  Dropping email_1 index...');
        try {
            await collection.dropIndex('email_1');
            console.log('✅ email_1 index dropped');
        } catch (error) {
            if (error.code === 27) {
                console.log('⚠️  Index email_1 does not exist, skipping...');
            } else {
                throw error;
            }
        }

        // Create new indexes with sparse: true
        console.log('\n🔨 Creating new indexes with sparse: true...');
        
        await collection.createIndex(
            { email: 1 },
            { unique: true, sparse: true, name: 'email_1' }
        );
        console.log('✅ Created email index (unique, sparse)');

        await collection.createIndex(
            { mobile: 1 },
            { unique: true, sparse: true, name: 'mobile_1' }
        );
        console.log('✅ Created mobile index (unique, sparse)');

        console.log('\n📋 Updated indexes:');
        const newIndexes = await collection.indexes();
        newIndexes.forEach(index => {
            console.log(`   - ${JSON.stringify(index)}`);
        });

        console.log('\n✅ Newsletter indexes fixed successfully!');
        console.log('   - Email and mobile can now be null for multiple documents');
        console.log('   - Unique constraint still applies for non-null values');

    } catch (error) {
        console.error('❌ Error fixing indexes:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the fix
fixNewsletterIndex()
    .then(() => {
        console.log('\n🎉 Index fix completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Index fix failed:', error);
        process.exit(1);
    });
