const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

const allowGuest = (req, res, next) => {
    if (!req.session.guestId) {
        req.session.guestId = 'guest_' + Math.random().toString(36).substring(2, 15);
        req.session.username = 'Guest_' + Math.random().toString(36).substring(2, 7);
    }
    next();
};

module.exports = {
    requireAuth,
    allowGuest
}; 