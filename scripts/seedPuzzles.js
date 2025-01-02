const mongoose = require('mongoose');
const Puzzle = require('../models/puzzle');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/chessUniverse', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const initialPuzzles = [
    {
        title: "Simple Fork",
        description: "Find the knight fork that wins material.",
        difficulty: 3,
        rating: 1200,
        themes: ['fork', 'tactics'],
        initialPosition: {
            fen: "r3k2r/ppp2ppp/2n5/3Nb3/2B5/8/PPP2PPP/R3K2R w KQkq - 0 1",
            turn: 'w'
        },
        solution: {
            moves: [
                { from: 'd5', to: 'f6', san: 'Nf6+' }
            ],
            explanation: "The knight fork on f6 attacks both the king and rook.",
            hints: [
                { moveIndex: 0, text: "Look for a knight move that attacks multiple pieces." }
            ]
        }
    },
    {
        title: "Discovered Attack",
        description: "Use a discovered attack to win material.",
        difficulty: 4,
        rating: 1400,
        themes: ['discovery', 'tactics'],
        initialPosition: {
            fen: "r1bqk2r/ppp2ppp/2n5/3n4/2BP4/5N2/PPP2PPP/R2QK2R w KQkq - 0 1",
            turn: 'w'
        },
        solution: {
            moves: [
                { from: 'c4', to: 'f7', san: 'Bxf7+' }
            ],
            explanation: "The bishop sacrifice reveals an attack on the knight.",
            hints: [
                { moveIndex: 0, text: "Consider sacrificing a piece to reveal an attack." }
            ]
        }
    },
    {
        title: "Mate in Two",
        description: "Find the forced checkmate in two moves.",
        difficulty: 5,
        rating: 1600,
        themes: ['mate', 'tactics'],
        initialPosition: {
            fen: "r1bq1rk1/ppp2ppp/2n5/3n4/2BP4/5N2/PPP2PPP/R2Q1RK1 w - - 0 1",
            turn: 'w'
        },
        solution: {
            moves: [
                { from: 'd4', to: 'f6', san: 'Bxf6' },
                { from: 'g7', to: 'f6', san: 'gxf6' },
                { from: 'd1', to: 'd8', san: 'Qd8#' }
            ],
            explanation: "Sacrifice the bishop to open the d-file for a queen mate.",
            hints: [
                { moveIndex: 0, text: "Look for a sacrifice that opens lines." },
                { moveIndex: 1, text: "The queen has a clear path to mate." }
            ]
        }
    },
    {
        title: "Pin and Win",
        description: "Use a pin to win material.",
        difficulty: 3,
        rating: 1300,
        themes: ['pin', 'tactics'],
        initialPosition: {
            fen: "r3k2r/ppp2ppp/2n5/4b3/2B5/2N5/PPP2PPP/R3K2R w KQkq - 0 1",
            turn: 'w'
        },
        solution: {
            moves: [
                { from: 'c4', to: 'e6', san: 'Be6' }
            ],
            explanation: "The bishop pin against the king wins the knight.",
            hints: [
                { moveIndex: 0, text: "Look for a way to pin a piece against the king." }
            ]
        }
    },
    {
        title: "Queen Sacrifice",
        description: "Sacrifice your queen for a beautiful checkmate.",
        difficulty: 7,
        rating: 1800,
        themes: ['sacrifice', 'mate', 'tactics'],
        initialPosition: {
            fen: "r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1",
            turn: 'w'
        },
        solution: {
            moves: [
                { from: 'd1', to: 'f3', san: 'Qxf3' },
                { from: 'e8', to: 'e7', san: 'Ke7' },
                { from: 'f3', to: 'f7', san: 'Qxf7#' }
            ],
            explanation: "The queen sacrifice leads to a forced mate.",
            hints: [
                { moveIndex: 0, text: "Consider sacrificing your strongest piece." },
                { moveIndex: 1, text: "The king is vulnerable in the center." }
            ]
        }
    }
];

async function seedPuzzles() {
    try {
        // Clear existing puzzles
        await Puzzle.deleteMany({});
        console.log('Cleared existing puzzles');

        // Insert new puzzles
        const result = await Puzzle.insertMany(initialPuzzles);
        console.log(`Successfully seeded ${result.length} puzzles`);

        // Close database connection
        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding puzzles:', error);
        mongoose.connection.close();
    }
}

// Run the seeding
seedPuzzles(); 