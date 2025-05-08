import express from 'express';
import bcrypt from 'bcrypt';

export function createAuthRoutes(usersCollection) {

    const authRoutes = express.Router();

    authRoutes.get('/login', async (req, res, next) => {
        try{
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            res.status(200).set({'Content-Type': 'text/html'})
                            .render('login', { errorMessage: ''});
        }
        catch(error){
            error.message = 'Error logging in!!';
            next(error);
        }
    });

    authRoutes.get('/signup', async (req, res, next) => {
        try{
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            res.status(200).set({'Content-Type': 'text/html'})
                            .render('signup', {errorMessage: ''});
        }
        catch(error){
            req.session.errorMessage = 'Error signing up!!';
            res.status(500).redirect('/movies');
        }
    });

    authRoutes.post('/login', async (req, res, next) => {
        try{
            const { username, password } = req.body;
            const user = await usersCollection.findOne({ username });

            if(!user){
                return res.render('login', { 
                            errorMessage: 'User not found. Please sign up.' });
            }
  
            if(user && await bcrypt.compare(password, user.password)){
                req.session.user = { username: user.username };
                req.session.successMessage = 'Logged in successfully!';
                return res.redirect('/movies');
            }

            res.render('login', { 
                        errorMessage: 'Login failed. Wrong username or password. Try again'
                    });
        }
        catch(error){
            error.message = 'Error logging in!!';
            next(error);
        }
    });

    authRoutes.post('/signup', async (req, res, next) => {
        try{
            const { username, password, confirmPassword } = req.body;
            const usernameRegex = /^[a-zA-Z][a-zA-Z0-9]{2,9}$/;

            if(!usernameRegex.test(username)){
                return res.status(400).render('signup', { 
                    errorMessage: 'Username must start with a letter and only contain letters and numbers (3-10 characters).' 
                });
            }

            if(!password || password.length < 6){
                return res.status(400).render('signup', { 
                    errorMessage: 'Password must be at least 6 characters long.'
                });
            }

            if(password !== confirmPassword){
                return res.status(400).render('signup', { 
                    errorMessage: 'New passwords do not match.'
                });
            }

            const userExists = await usersCollection.findOne({ username });

            if(userExists){
                return res.status(400).render('signup', { 
                    errorMessage: 'User already exists.' 
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await usersCollection.insertOne({
                                    username,
                                    password: hashedPassword
            });

            req.session.user = { username };
            res.redirect('/movies');
        }
        catch(error){
            error.message = 'Error signing up!!';
            next(error);
        }
    });

    authRoutes.get('/logout', async (req, res, next) => {
        try{
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            
            res.cookie('successMessage', 'Logged out successfully!', { maxAge: 3000 });
            req.session.destroy();
            res.redirect('/movies');
        }
        catch(error){
            error.message = 'Error logging out!!';
            next(error);
        }
    });

    return authRoutes;
}