const { parentPort } = require('worker_threads');
const { Engine } = require('node-uci');

let engine = null;
let isReady = false;

async function initializeEngine() {
    try {
        engine = new Engine('stockfish');
        await engine.init();
        await engine.isready();
        isReady = true;
        
        // Listen for engine output
        engine.on('info', (info) => {
            if (info.score && info.depth) {
                parentPort.postMessage({
                    type: 'evaluation',
                    eval: info.score.value / 100, // Convert centipawns to pawns
                    depth: info.depth,
                    pv: info.pv
                });
            }
        });
    } catch (error) {
        parentPort.postMessage({
            type: 'error',
            error: error.message
        });
    }
}

// Initialize engine
initializeEngine();

// Handle messages from main thread
parentPort.on('message', async (message) => {
    if (!isReady) {
        parentPort.postMessage({
            type: 'error',
            error: 'Engine not ready'
        });
        return;
    }

    try {
        switch (message.type) {
            case 'configure':
                await configureEngine(message.options);
                break;

            case 'getMove':
                await getBestMove(message.fen, message.depth, message.timeLimit);
                break;

            case 'stop':
                await engine.stop();
                break;

            case 'quit':
                await engine.quit();
                process.exit(0);
                break;
        }
    } catch (error) {
        parentPort.postMessage({
            type: 'error',
            error: error.message
        });
    }
});

// Configure engine settings
async function configureEngine(options) {
    try {
        for (const [key, value] of Object.entries(options)) {
            await engine.setoption(key, value);
        }
        await engine.isready();
    } catch (error) {
        throw new Error(`Failed to configure engine: ${error.message}`);
    }
}

// Get best move for position
async function getBestMove(fen, depth, timeLimit) {
    try {
        await engine.position(fen);
        
        // Set search parameters
        const searchParams = {
            depth: depth
        };

        // Add time limit if specified
        if (timeLimit) {
            searchParams.movetime = timeLimit;
        }

        // Start search
        const result = await engine.go(searchParams);
        
        parentPort.postMessage({
            type: 'bestmove',
            move: result.bestmove
        });
    } catch (error) {
        throw new Error(`Failed to get best move: ${error.message}`);
    }
}

// Clean up on exit
process.on('exit', async () => {
    if (engine) {
        await engine.quit();
    }
}); 