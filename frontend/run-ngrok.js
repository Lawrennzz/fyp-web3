const { execSync } = require('child_process');

console.log('Starting ngrok tunnel to port 3000...');

try {
    // Set auth token first
    console.log('Setting ngrok auth token...');
    execSync('ngrok authtoken 2zJHNJYPENmRNygHq5sUttRSVBZ_2szQEhj7RvjjfuuPv2AuR', { encoding: 'utf8' });

    // Run ngrok command
    console.log('Starting ngrok tunnel...');
    const output = execSync('ngrok http 3000', { encoding: 'utf8', stdio: 'inherit' });
} catch (error) {
    console.error('Error running ngrok:', error.message);

    // Try running with npx
    try {
        console.log('Trying with npx...');
        execSync('npx ngrok authtoken 2zJHNJYPENmRNygHq5sUttRSVBZ_2szQEhj7RvjjfuuPv2AuR', { encoding: 'utf8' });
        const output = execSync('npx ngrok http 3000', { encoding: 'utf8', stdio: 'inherit' });
    } catch (npxError) {
        console.error('Error running with npx:', npxError.message);
        console.log('\nPlease try running ngrok manually with these steps:');
        console.log('1. Download ngrok from https://ngrok.com/download');
        console.log('2. Extract the downloaded file');
        console.log('3. Open a command prompt in the extracted folder');
        console.log('4. Run: ngrok authtoken 2zJHNJYPENmRNygHq5sUttRSVBZ_2szQEhj7RvjjfuuPv2AuR');
        console.log('5. Run: ngrok http 3000');
    }
} 