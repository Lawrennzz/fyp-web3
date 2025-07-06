const { spawn } = require('child_process');
const readline = require('readline');

console.log('Starting ngrok tunnel to port 3000...');

// Start ngrok process
const ngrok = spawn('ngrok', ['http', '3000']);

// Create readline interface to read from ngrok's stdout
const rl = readline.createInterface({
    input: ngrok.stdout,
    terminal: false
});

// Listen for ngrok output
rl.on('line', (line) => {
    console.log(line);

    // Look for the forwarding URL in the output
    if (line.includes('Forwarding')) {
        const match = line.match(/https:\/\/[a-zA-Z0-9.-]+\.ngrok\.io/);
        if (match) {
            const url = match[0];
            console.log('\n=================================================');
            console.log(`🚀 NGROK PUBLIC URL: ${url}`);
            console.log('=================================================');
            console.log('\nCopy this URL and paste it in the QR Code modal');
            console.log('Press Ctrl+C to stop the ngrok tunnel');
        }
    }
});

// Handle errors
ngrok.stderr.on('data', (data) => {
    console.error(`ngrok error: ${data}`);
});

// Handle process exit
ngrok.on('close', (code) => {
    console.log(`ngrok process exited with code ${code}`);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
    console.log('Stopping ngrok tunnel...');
    ngrok.kill();
    process.exit();
}); 