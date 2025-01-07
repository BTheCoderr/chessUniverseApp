# Chess Universe

## Overview
Chess Universe is a comprehensive online chess platform that offers a variety of features for players of all skill levels. The application provides a modern, user-friendly interface for playing chess, learning strategies, and engaging with the chess community.

## Features

### Core Features
- **Play Chess**
  - Real-time multiplayer chess games
  - Play against AI bots with adjustable difficulty
  - Multiple time control options
  - Drag-and-drop piece movement
  - Move validation and legal move highlighting

### Game Modes (Coming Soon)
- **Tournaments**
  - Single elimination
  - Double elimination
  - Round robin
  - Swiss system tournaments
  - Custom tournament creation

- **Puzzles**
  - Daily puzzles
  - Tactical challenges
  - Rating-based difficulty
  - Progress tracking

- **Analysis**
  - Game analysis tools
  - Opening explorer
  - Position evaluation
  - Move suggestions

- **Game History**
  - Archive of past games
  - Game statistics
  - Performance tracking
  - Export functionality

### Learning Resources (Coming Soon)
- **Tutorials**
  - Interactive lessons
  - Opening strategies
  - Endgame techniques
  - Tactical patterns

### Additional Features
- **Profile System**
  - User ratings
  - Statistics tracking
  - Achievement system
  - Customizable settings

- **Support & Help**
  - FAQ section
  - Contact support
  - Community forums
  - Help documentation

## Technical Stack
- **Frontend**
  - HTML5
  - CSS3
  - JavaScript
  - EJS templating
  - Socket.IO client

- **Backend**
  - Node.js
  - Express.js
  - MongoDB
  - Socket.IO
  - Stockfish chess engine

- **Dependencies**
  - chess.js
  - chessboard.js
  - Socket.IO
  - Express
  - Mongoose
  - and more (see package.json)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chess-universe.git
cd chess-universe
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=mongodb://localhost:27017/chessUniverse
SESSION_SECRET=your-secret-key
PORT=3000
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

5. Access the application:
Open your browser and navigate to `http://localhost:3000`

## Development

### Running in Development Mode
```bash
npm run dev
```

### Running in Production Mode
```bash
npm start
```

## Contributing
We welcome contributions to Chess Universe! Please feel free to submit pull requests or create issues for bugs and feature requests.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Chess.js library
- Chessboard.js library
- Stockfish chess engine
- All contributors and supporters of the project
