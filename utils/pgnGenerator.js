/**
 * Utility functions for generating PGN (Portable Game Notation) files
 */

const generatePGN = (gameData) => {
    const date = new Date(gameData.date).toISOString().split('T')[0].replace(/-/g, '.');
    
    return `[Event "${gameData.event || 'Chess Universe Game'}"]
[Site "Chess Universe Online"]
[Date "${date}"]
[White "${gameData.white}"]
[Black "${gameData.black}"]
[Result "${gameData.result}"]
[TimeControl "${gameData.timeControl || '-'}"]
[WhiteElo "${gameData.whiteElo || '-'}"]
[BlackElo "${gameData.blackElo || '-'}"]

${gameData.moves.join(' ')}
`;
};

module.exports = { generatePGN }; 