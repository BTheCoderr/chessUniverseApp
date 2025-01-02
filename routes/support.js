const express = require('express');
const router = express.Router();

// Main support page
router.get('/', (req, res) => {
    res.render('support/index', {
        title: 'Help & Support',
        user: req.session.user,
        guestId: req.session.guestId,
        guestUsername: req.session.guestUsername
    });
});

module.exports = router; 