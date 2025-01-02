const express = require('express');
const router = express.Router();

// Simple tutorial route - Coming Soon
router.get('/', async (req, res) => {
    res.render('tutorials/index', { 
        title: 'Chess Tutorials',
        user: req.session.user,
        guestId: req.session.guestId,
        guestUsername: req.session.guestUsername
    });
});

module.exports = router; 