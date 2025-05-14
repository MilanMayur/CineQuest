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
            res.status(500).redirect('/home');
        }
    });

    authRoutes.post('/login', async (req, res, next) => {
        try{
            const { identifier, password } = req.body;
            const user = await usersCollection.findOne({
                $or: [
                    { name: identifier },
                    { email: identifier }
                ]
            });

            if(!user){
                return res.render('login', { 
                            errorMessage: 'Email or Username not found. Please sign up.' });
            }
  
            if(user && await bcrypt.compare(password, user.password)){
                req.session.user = { name: user.name, email: user.email };
                
                console.log('Session started- user: ', req.session.user);//debug

                req.session.successMessage = 'Logged in successfully!';
                return res.redirect('/home');
            }

            res.render('login', { 
                        errorMessage: 'Login failed. Wrong email or password. Try again'
                    });
        }
        catch(error){
            error.message = 'Error logging in!!';
            next(error);
        }
    });

    authRoutes.post('/signup', async (req, res, next) => {
        try{
            const { name, email, password, confirmPassword } = req.body;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if(!name || name.length < 2 ){
                return res.status(400).render('signup', {
                    errorMessage: 'Username must be at least 2 characters long.'
                });
            }

            if(!emailRegex.test(email)){
                return res.status(400).render('signup', {
                    errorMessage: 'Invalid email format.'
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

            const emailExists = await usersCollection.findOne({ email });
            const userExists = await usersCollection.findOne({ name });

            if(emailExists){
                return res.status(400).render('signup', { 
                    errorMessage: 'Email exists please Login.' 
                });
            }

            if(userExists){
                return res.status(400).render('signup', { 
                    errorMessage: 'Username already taken.' 
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await usersCollection.insertOne({
                                    name,
                                    email,
                                    password: hashedPassword
            });

            req.session.user = { name, email };

            //console.log('Session started- user: ', name);//debug
            req.session.successMessage = 'Successfully signed in!';
            res.redirect('/home');
            /*res.render('index', {
                successMessage: 'Successfully signed in!'
            });*/
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

            //console.log('Session ended- user: ', req.session.user);//debug
            
            res.cookie('successMessage', 'Logged out successfully!', { maxAge: 3000 });
            req.session.destroy();
            res.redirect('/home');
        }
        catch(error){
            error.message = 'Error logging out!!';
            next(error);
        }
    });

    return authRoutes;
}
