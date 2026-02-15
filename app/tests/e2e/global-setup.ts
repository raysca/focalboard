export default async function globalSetup() {
    console.log('\n🧪 Setting up test environment...\n')

    // Set environment variable for in-memory test database
    // The web server will automatically run migrations and seed when it starts in test mode
    process.env.NODE_ENV = 'test'

    console.log('✅ Test environment configured')
    console.log('   - NODE_ENV=test (in-memory database)')
    console.log('   - Migrations and seeding will run when web server starts\n')
}
