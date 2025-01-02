const Tutorial = require('../models/tutorial');

class TutorialService {
    // Get tutorials by category and difficulty
    async getTutorialsByCategory(category, difficulty) {
        const query = {};
        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;
        
        return await Tutorial.find(query)
            .sort('order')
            .select('title description category difficulty estimatedDuration slug');
    }

    // Get a specific tutorial by slug
    async getTutorialBySlug(slug) {
        return await Tutorial.findOne({ slug });
    }

    // Validate an exercise attempt
    async validateExercise(exerciseId, move, position) {
        const exercise = await Tutorial.findOne(
            { 'exercises._id': exerciseId },
            { 'exercises.$': 1 }
        );

        if (!exercise || !exercise.exercises[0]) {
            throw new Error('Exercise not found');
        }

        const isCorrect = exercise.exercises[0].correctMove === move;
        return {
            correct: isCorrect,
            explanation: isCorrect ? exercise.exercises[0].explanation : null
        };
    }

    // Generate a hint for an exercise
    async generateHint(exerciseId, position, previousMoves) {
        const exercise = await Tutorial.findOne(
            { 'exercises._id': exerciseId },
            { 'exercises.$': 1 }
        );

        if (!exercise || !exercise.exercises[0]) {
            throw new Error('Exercise not found');
        }

        const hints = exercise.exercises[0].hints;
        const hintIndex = Math.min(previousMoves.length, hints.length - 1);
        
        return {
            hint: hints[hintIndex] || 'No more hints available'
        };
    }

    // Track user progress in a tutorial
    async trackProgress(userId, tutorialId, progress) {
        // This would typically update a UserProgress model
        // For now, we'll just return success
        return { success: true };
    }

    // Get next recommended tutorial
    async getNextRecommendedTutorial(userId) {
        // This would typically use user's history and progress
        // For now, return the first beginner tutorial
        return await Tutorial.findOne({ difficulty: 'beginner' })
            .sort('order')
            .select('title description slug');
    }

    // Create initial tutorials if none exist
    async createInitialTutorials() {
        const count = await Tutorial.countDocuments();
        if (count === 0) {
            const tutorials = [
                {
                    title: 'Chess Basics: How Pieces Move',
                    slug: 'chess-basics-piece-movement',
                    description: 'Learn how each chess piece moves on the board',
                    category: 'basics',
                    difficulty: 'beginner',
                    estimatedDuration: 15,
                    order: 1,
                    content: [
                        {
                            title: 'The Pawn',
                            type: 'text',
                            text: 'Pawns move forward one square at a time. On their first move, they can move two squares. They capture diagonally.'
                        },
                        {
                            title: 'Pawn Position',
                            type: 'position',
                            position: {
                                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                                description: 'Initial position of pawns'
                            }
                        }
                    ],
                    exercises: [
                        {
                            type: 'move',
                            position: {
                                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                                description: 'Move the pawn from e2 to e4'
                            },
                            correctMove: 'e2e4',
                            explanation: 'Great! The pawn can move two squares on its first move.',
                            hints: ['Look at the e2 pawn', 'Try moving it forward two squares']
                        }
                    ]
                }
                // Add more tutorials here
            ];

            await Tutorial.insertMany(tutorials);
        }
    }
}

module.exports = new TutorialService(); 