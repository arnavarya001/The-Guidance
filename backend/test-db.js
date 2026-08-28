const db = require('./db');

async function run() {
  console.log("=== Testing Database Operations ===");

  try {
    // 1. Read classes
    const classes = await db.getCollection('classes');
    console.log(`Found ${classes.length} classes.`);
    if (classes.length === 0) {
      console.error("FAIL: No classes found!");
      process.exit(1);
    }

    // 2. Find student user
    const student = await db.findOne('users', { email: 'aarav@gmail.com' });
    if (!student) {
      console.error("FAIL: Aarav student account not found!");
      process.exit(1);
    }
    console.log(`Successfully retrieved student: ${student.name}, Class: ${student.class}`);

    // 3. Test insert & delete
    const testUser = {
      id: 'u_test',
      email: 'test@test.com',
      name: 'Testy Tester',
      password: 'testpassword123'
    };

    await db.insert('users', testUser);
    const found = await db.findOne('users', { id: 'u_test' });
    if (!found || found.name !== 'Testy Tester') {
      console.error("FAIL: Insert test failed!");
      process.exit(1);
    }
    console.log("Insert operation works.");

    await db.delete('users', { id: 'u_test' });
    const deleted = await db.findOne('users', { id: 'u_test' });
    if (deleted) {
      console.error("FAIL: Delete test failed!");
      process.exit(1);
    }
    console.log("Delete operation works.");

    console.log("=== All Database Operations Test Passed! ===");
    process.exit(0);
  } catch (err) {
    console.error("FAIL: Database error during test:", err);
    process.exit(1);
  }
}

run();
