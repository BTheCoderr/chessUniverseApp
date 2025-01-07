# Chess Universe App 🎮♟️

A real-time multiplayer chess application built with Node.js, Express, and Socket.IO. Play chess online, analyze games, solve puzzles, and compete with AI opponents.

## Features 🌟

- **Real-time Multiplayer Chess**
  - Play against other players online
  - Real-time game updates using WebSocket
  - In-game chat functionality
  - ELO rating system

- **AI Opponents**
  - Multiple difficulty levels
  - Powered by Stockfish chess engine
  - Customizable AI playing styles
  - Analysis of your games

- **Game Modes**
  - Classic Chess
  - Puzzle Solving
  - Game Analysis
  - Tournament Play
  - Bot Matches

- **User Features**
  - User authentication and profiles
  - Game history and statistics
  - Performance tracking
  - Social features

## Tech Stack 💻

- **Backend**
  - Node.js
  - Express.js
  - Socket.IO
  - MongoDB with Mongoose
  - JWT Authentication

- **Frontend**
  - EJS Templates
  - JavaScript (ES6+)
  - CSS3
  - WebSocket client
  - Chess.js library

- **Tools & DevOps**
  - Webpack for asset bundling
  - Jest for testing
  - CodeQL for security analysis
  - GitHub Actions for CI/CD
  - NPM for package management

## Getting Started 🚀

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- NPM or Yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/BTheCoderr/chessUniverseApp.git
   cd chessUniverseApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file in the root directory:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_session_secret
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

### Production Build

To create a production build:
```bash
npm run build
npm start
```

## Project Structure 📁

```
chessUniverseApp/
├── public/           # Static assets
│   ├── css/         # Stylesheets
│   ├── js/          # Client-side JavaScript
│   └── images/      # Image assets
├── views/           # EJS templates
├── routes/          # Express routes
├── models/          # Mongoose models
├── middleware/      # Custom middleware
├── services/        # Business logic
├── sockets/         # WebSocket handlers
├── utils/           # Utility functions
└── tests/          # Test files
```

## Development 🛠️

### Running Tests
```bash
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- Jest for unit testing
- CodeQL for security analysis

### Build Process
- Webpack bundles assets
- Babel transpiles modern JavaScript
- PostCSS processes CSS
- Asset optimization for production

## Security 🔒

- Regular dependency updates
- CodeQL security scanning
- Dependency vulnerability checks
- Session management
- Input validation
- XSS protection

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 👏

- [Chess.js](https://github.com/jhlywa/chess.js) for chess logic
- [Socket.IO](https://socket.io/) for real-time communication
- [Stockfish](https://stockfishchess.org/) for chess engine
- All contributors and users of the application

## Contact 📧

- GitHub: [@BTheCoderr](https://github.com/BTheCoderr)
- Project Link: [https://github.com/BTheCoderr/chessUniverseApp](https://github.com/BTheCoderr/chessUniverseApp)

---
Made with ❤️ by BTheCoderr
