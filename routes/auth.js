const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Login page
router.get('/login', (req, res) => {
    if (req.session.userId) {
        res.redirect('/');
    } else {
        res.render('login', { title: 'Login' });
    }
});

// Login process
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (user && await user.verifyPassword(password)) {
            req.session.userId = user._id;
            req.session.username = user.username;
            res.redirect('/');
        } else {
            res.render('login', { 
                title: 'Login',
                error: 'Invalid username or password' 
            });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { 
            title: 'Login',
            error: 'An error occurred during login' 
        });
    }
});

// Register page
router.get('/register', (req, res) => {
    if (req.session.userId) {
        res.redirect('/');
    } else {
        res.render('register', { title: 'Register' });
    }
});

// Register process
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, confirm_password } = req.body;

        // Validate password match
        if (password !== confirm_password) {
            return res.render('register', {
                title: 'Register',
                error: 'Passwords do not match'
            });
        }

        // Check if username exists
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.render('register', {
                title: 'Register',
                error: 'Username or email already exists'
            });
        }

        // Create new user - password will be hashed by the pre-save hook
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        // Log the user in
        req.session.userId = user._id;
        req.session.username = user.username;
        res.redirect('/');
    } catch (err) {
        console.error('Registration error:', err);
        res.render('register', {
            title: 'Register',
            error: 'An error occurred during registration'
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

module.exports = router; 