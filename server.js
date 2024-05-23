const express = require('express')
const path = require('path')
const mysql = require('mysql')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const http = require('http')
const socketIo = require('socket.io')
const session = require('express-session')
const bcrypt = require('bcrypt')

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// Set the view engine to EJS
app.set('view engine', 'ejs')

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Session setup
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}))

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
})

db.connect((err) => {
    if (err) {
        throw err
    }
    console.log('Connected to database')
})

// Routes
app.get('/', (req, res) => {
    res.render('login', { error: null })
})

app.get('/register', (req, res) => {
    res.render('register', { error: null })
})

app.post('/register', async (req, res) => {
    const { username, password } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)'
    db.query(sql, [username, hashedPassword], (err, result) => {
        if (err) {
            return res.render('register', { error: 'Error registering user' })
        }
        res.redirect('/')
    })
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body
    const sql = 'SELECT * FROM users WHERE username = ?'
    db.query(sql, [username], async (err, results) => {
        if (err) {
            return res.render('login', { error: 'Error logging in' })
        }
        if (results.length > 0) {
            const user = results[0]
            const match = await bcrypt.compare(password, user.password)
            if (match) {
                req.session.userId = user.id
                req.session.username = username
                res.redirect('/game')
            } else {
                res.render('login', { error: 'Invalid username or password' })
            }
        } else {
            res.render('login', { error: 'Invalid username or password' })
        }
    })
})

app.get('/game', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/')
    }
    const username = req.session.username || 'Guest'
    res.render('index', { username })
})

app.get('/settings', (req, res) => {
    res.render('settings', { error: null })
})

app.post('/save', (req, res) => {
    const gameState = req.body.state
    const sql = 'INSERT INTO games (state) VALUES (?)'
    db.query(sql, [gameState], (err, result) => {
        if (err) {
            return res.status(500).send('Error saving game state')
        }
        res.send({ id: result.insertId })
    })
})

app.get('/load/:id', (req, res) => {
    const gameId = req.params.id
    const sql = 'SELECT state FROM games WHERE id = ?'
    db.query(sql, [gameId], (err, results) => {
        if (err) {
            return res.status(500).send('Error loading game state')
        }
        if (results.length > 0) {
            res.send({ state: results[0].state })
        } else {
            res.status(404).send('Game not found')
        }
    })
})

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected')

    socket.on('move', (data) => {
        // Broadcast the move to all connected clients
        socket.broadcast.emit('move', data)
    })

    socket.on('wager', (data) => {
        const { amount } = data
        const gameId = 1 // Replace with actual game ID
        const placedBy = 'Guest' // Replace with actual user ID or username
        const sql = 'INSERT INTO wagers (game_id, amount, placed_by) VALUES (?, ?, ?)'
        db.query(sql, [gameId, amount, placedBy], (err, result) => {
            if (err) {
                console.error('Error saving wager:', err)
            } else {
                console.log('Wager saved:', result)
            }
        })
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected')
    })
})

// Start the server
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
