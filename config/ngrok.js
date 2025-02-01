const ngrok = require('ngrok');

async function setupNgrok() {
    try {
        if (process.env.NODE_ENV !== 'production') {
            const url = await ngrok.connect({
                addr: process.env.PORT || 3000,
                region: 'us',
                authtoken: process.env.NGROK_AUTH_TOKEN
            });
            console.log('Ngrok tunnel created:', url);
            process.env.NGROK_URL = url;
            return url;
        }
    } catch (err) {
        console.error('Error setting up ngrok:', err);
        process.env.NGROK_URL = `http://localhost:${process.env.PORT || 3000}`;
    }
}

module.exports = setupNgrok; 