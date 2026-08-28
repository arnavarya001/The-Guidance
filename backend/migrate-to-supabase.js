require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Validate env variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  console.error('\x1b[31mError: Please set valid SUPABASE_URL and SUPABASE_ANON_KEY in your .env file before running migration.\x1b[0m');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const DB_PATH = path.join(__dirname, 'data', 'db.json');

if (!fs.existsSync(DB_PATH)) {
  console.error(`\x1b[31mError: db.json not found at ${DB_PATH}. Cannot migrate.\x1b[0m`);
  process.exit(1);
}

async function migrateCollection(tableName, records, mappingFn = null) {
  if (!records || records.length === 0) {
    console.log(`Table ${tableName}: No records to migrate.`);
    return;
  }

  console.log(`Table ${tableName}: Migrating ${records.length} records...`);

  // Insert in batches of 100 to prevent hitting payload/request limits
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const mappedBatch = mappingFn ? batch.map(mappingFn) : batch;

    const { error } = await supabase
      .from(tableName)
      .upsert(mappedBatch);

    if (error) {
      console.error(`\x1b[31mError migrating table ${tableName} at index ${i}:`, error.message, '\x1b[0m');
      console.error('Failed record sample:', mappedBatch[0]);
      throw error;
    }
  }

  console.log(`\x1b[32mTable ${tableName}: Successfully migrated ${records.length} records.\x1b[0m`);
}

async function runMigration() {
  console.log('=== Starting Supabase Migration ===');
  
  const rawData = fs.readFileSync(DB_PATH, 'utf-8');
  const data = JSON.parse(rawData);

  try {
    // 1. Processed Papers
    if (data.processed_papers) {
      const records = data.processed_papers.map(hash => ({ paper_hash: hash }));
      await migrateCollection('processed_papers', records);
    }

    // 2. Classes
    await migrateCollection('classes', data.classes);

    // 3. Subjects
    await migrateCollection('subjects', data.subjects);

    // 4. Chapters
    await migrateCollection('chapters', data.chapters);

    // 5. Study Materials
    await migrateCollection('study_materials', data.study_materials);

    // 6. Users
    await migrateCollection('users', data.users);

    // 7. Questions
    await migrateCollection('questions', data.questions);

    // 8. Tests
    await migrateCollection('tests', data.tests);

    // 9. Test Attempts
    await migrateCollection('test_attempts', data.test_attempts);

    // 10. PYQs
    await migrateCollection('pyqs', data.pyqs);

    // 11. PYQ Sources
    await migrateCollection('pyq_sources', data.pyq_sources);

    // 12. Syllabus
    await migrateCollection('syllabus', data.syllabus);

    console.log('\n\x1b[32m=== Migration completed successfully! ===\x1b[0m');
  } catch (err) {
    console.error('\n\x1b[31m=== Migration failed! ===\x1b[0m');
    console.error(err);
    process.exit(1);
  }
}

runMigration();
