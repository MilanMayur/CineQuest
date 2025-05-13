import express from 'express';
import bcrypt from 'bcrypt';


export function createUserRoutes(usersCollection, moviesCollection){

    const userRoutes = express.Router();

    userRoutes.get('/profile', async (req, res, next) => {
        try{
            //const successMessage = req.session.successMessage || null;
            //const errorMessage = req.session.errorMessage || null;

            if(!req.session.user) return res.redirect('/login');

            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            const userData = await usersCollection.findOne({ email: req.session.user.email });

            if(!userData)  return res.status(404).send('User not found');

            res.render('profile', {
                                user: req.session.user,
                                favoritesCount: userData.favorites ? userData.favorites.length : 0
            });
        }
        catch(error){
            error.message = 'Error loading profile!!';
            next(error);
        }
    });
  
    userRoutes.get('/change-password', (req, res, next) => {
        try{
            const errorMessage = req.session.errorMessage || '';

            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            if(!req.session.user) return res.redirect('/login');

            res.status(200).set({'Content-Type': 'text/html'}).render('change_password', { 
                user: req.session.user, 
            });
        }
        catch(error){
            req.session.errorMessage = 'Error changing password!!';
            res.redirect('/profile');
        }
    });

    userRoutes.post('/change-password', async (req, res, next) => {
        try {
            if(!req.session.user) return res.redirect('/login');
  
            const { currentPassword, newPassword, confirmNewPassword } = req.body;

            const userData = await usersCollection.findOne({ email: req.session.user.email });

            if(!currentPassword || !newPassword || !confirmNewPassword){
                return res.status(400).set({'Content-Type': 'text/html'}).render('change_password', { 
                    errorMessage: 'All fields are required'
                });
            }

            if(newPassword !== confirmNewPassword){
                return res.status(400).set({'Content-Type': 'text/html'}).render('change_password', { 
                    errorMessage: 'New passwords do not match'
                });
            }
  
            if(newPassword.length < 6){
                return res.status(400).set({'Content-Type': 'text/html'}).render('change_password', { 
                    errorMessage: 'New password must be at least 6 characters'
                });
            }
  
            if(!userData){
                return res.status(404).set({'Content-Type': 'text/html'}).render('change_password', { 
                    errorMessage: 'User not found'
                });
            }

            const isMatch = await bcrypt.compare(currentPassword, userData.password);

            if(!isMatch){ 
                return res.status(401).set({'Content-Type': 'text/html'}).render('change_password', { 
                    errorMessage: 'Current password is incorrect'
                });
            }
        
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await usersCollection.updateOne(
                                { email: req.session.user.email },
                                { $set: { password: hashedPassword } }
            );
        
            req.session.successMessage = 'Password successfully changed!';
            res.status(200).set({'Content-Type': 'text/html'}).redirect('/profile');
        } 
        catch(error){
            req.session.errorMessage = 'Error changing password!!';
            res.redirect('/profile');
        }
    });
  
    userRoutes.post('/delete-account', async (req, res, next) => {
        try {
            if(!req.session.user) return res.redirect('/login');
  
            const userEmail = req.session.user.email;
  
            await usersCollection.deleteOne({ email: userEmail });

            await moviesCollection.updateMany(
                { 'reviews.email': userEmail },
                { $set: { 'reviews.$[elem].name': 'Deleted User', 'reviews.$[elem].email': '' }},
                { arrayFilters: [{ 'elem.email': userEmail }]}
            );
  
            req.session.destroy(error => {
                if(error){
                    console.error('Error destroying session:', error);
                }
                res.cookie('successMessage', 'Account deleted successfully!', { maxAge: 3000 });
                res.redirect('/home');
            });
        } 
        catch(error){
            req.session.errorMessage = 'Error deleting account!!';
            res.redirect('/profile');
        }
    });

    userRoutes.get('/my-reviews', async (req, res, next) => {
        try {
            if(!req.session.user) return res.redirect('/login');

            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
      
            const email = req.session.user.email;
            const page = parseInt(req.query.page) || 1;
            const itemsPerPage = 10;
            const skip = (page - 1) * itemsPerPage;
      
            const pipeline = [
                { $match: { "reviews.email": email } },
                { $unwind: "$reviews" },
                { $match: { "reviews.email": email } },
                { $sort: { "reviews.date": -1 } },
                {
                    $facet: {
                        total: [{ $count: "count" }],
                        reviews: [
                            { $skip: skip },
                            { $limit: itemsPerPage },
                            {
                                $project: {
                                    movieId: "$_id",
                                    title: "$title",
                                    comment: "$reviews.comment",
                                    rating: "$reviews.rating",
                                    date: "$reviews.date"
                                }
                            }
                        ]
                    }
                }
            ];
    
            const result = await moviesCollection.aggregate(pipeline).toArray();
            const userReviews = result[0].reviews;
            const total = result[0].total[0]?.count || 0;
      
            res.render('my_reviews', {
                user: req.session.user,
                userReviews,
                currentPage: page,
                totalPages: Math.ceil(total / itemsPerPage)
            });
        } 
        catch(error){
            error.message = 'Error fetching your reviews!';
            next(error);
        }
    });

    return userRoutes;
}