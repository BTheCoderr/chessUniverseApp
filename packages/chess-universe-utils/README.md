# Chess Universe Utilities

A collection of utility functions and classes for chess applications.

## Installation

```bash
npm install @chess-universe/utils
```

Or with yarn:

```bash
yarn add @chess-universe/utils
```

## Features

- Material calculation
- Bot player functionality
- Game analysis tools
- Move validation utilities

## Usage

### Material Calculator

```javascript
import { MaterialCalculator } from '@chess-universe/utils';

// Calculate material balance from a chess.js board position
const balance = MaterialCalculator.calculateBalance(game.board());

// Calculate material difference between two positions
const difference = MaterialCalculator.calculateDifference(position1, position2);

// Get piece value
const pawnValue = MaterialCalculator.getPieceValue('p'); // Returns 1
const queenValue = MaterialCalculator.getPieceValue('q'); // Returns 9
```

## Dependencies

- chess.js: ^1.0.0-beta.7
- jquery: >=3.0.0 (peer dependency)

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT 