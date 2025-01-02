const express = require('express');
const router = express.Router();

// Main about page
router.get('/', (req, res) => {
    res.render('about/index', {
        title: 'About Chess Universe',
        user: req.session.user,
        guestId: req.session.guestId,
        guestUsername: req.session.guestUsername
    });
});

module.exports = router; 