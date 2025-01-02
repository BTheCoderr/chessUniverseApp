const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Import routes
const gameRouter = require('./routes/game');
const tournamentRouter = require('./routes/tournament');
const { router: historicalRouter, setupHistoricalGameSocket } = require('./routes/historical');
const tutorialRouter = require('./routes/tutorial');
const puzzleRouter = require('./routes/puzzles');
const botRouter = require('./routes/bot');
const authRouter = require('./routes/auth');
const supportRouter = require('./routes/support');
const aboutRouter = require('./routes/about');
const analysisRouter = require('./routes/analysis');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'chess-universe-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.use('/game', gameRouter);
app.use('/tournament', tournamentRouter);
app.use('/historical', historicalRouter);
app.use('/tutorial', tutorialRouter);
app.use('/puzzles', puzzleRouter);
app.use('/bot', botRouter);
app.use('/auth', authRouter);
app.use('/support', supportRouter);
app.use('/about', aboutRouter);
app.use('/analysis', analysisRouter);

// Home route (landing page)
app.get('/', (req, res) => {
    res.render('landing', {
        user: req.session.user,
        guestId: req.session.guestId,
        guestUsername: req.session.guestUsername || 'Guest'
    });
});

// Lobby route
app.get('/lobby', (req, res) => {
    res.render('lobby', {
        user: req.session.user,
        guestId: req.session.guestId,
        guestUsername: req.session.guestUsername || 'Guest'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        error: 'Something broke!',
        message: err.message
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join', (data) => {
        console.log('Client joined:', data);
        socket.join(data.mode);
        socket.emit('gameStart', {
            color: 'white',
            white: data.guestUsername,
            black: 'Opponent'
        });
    });

    socket.on('move', (move) => {
        socket.broadcast.to(socket.gameRoom).emit('move', move);
    });

    socket.on('findOpponent', () => {
        setTimeout(() => {
            socket.emit('gameStart', {
                color: 'white',
                white: socket.guestUsername,
                black: 'Opponent'
            });
        }, 2000);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Connect to MongoDB and start server
async function startServer() {
    try {
        await mongoose.connect('mongodb://localhost:27017/chessUniverse', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    }
}

startServer();
