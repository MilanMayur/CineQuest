import express from 'express';
import { ObjectId } from 'mongodb';


export function createFavoritesRoutes(usersCollection, moviesCollection) {

    const favoritesRoutes  = express.Router();
    
    favoritesRoutes.get('/favorites', async (req, res, next) => {
        try{
            if(!req.session.user) return res.redirect('/login');

            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            });        

            const userData = await usersCollection.findOne({ username: req.session.user.username });

            const allFavorites = userData?.favorites || [];
            const totalFavorites = allFavorites.length;

            if(totalFavorites === 0){
                return res.render('favorites', {
                    favorites: [],
                    user: req.session.user,
                    currentPage: 1,
                    totalPages: 1
                });
            } 

            const page = parseInt(req.query.page) || 1;
            const itemsPerPage = 15;
            const skip = (page - 1) * itemsPerPage;

            const paginatedFavorites = allFavorites.slice(skip, skip + itemsPerPage);
            const favoriteMovieIds = paginatedFavorites.filter(id => ObjectId.isValid(id))
                                                        .map(id => new ObjectId(id));

            const favoriteMovies = await moviesCollection.find({
                                      _id: { $in: favoriteMovieIds }
                                    }).toArray();

            res.status(200).set({'Content-Type': 'text/html'}).render('favorites', {
                            favorites: favoriteMovies,
                            user: req.session.user,
                            currentPage: page,
                            totalPages: Math.ceil(totalFavorites / itemsPerPage)
            });
        }
        catch(error){
            error.message = 'Error accessing favorites!!';
            next(error);
        }
    });

    favoritesRoutes.post('/favorites/add', async (req, res) => {
        try{
            if(!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  
            const { movieId } = req.body;
  
            if(!movieId) return res.status(400).json({ success: false, message: 'No movie ID provided.' });

            //console.log('Received movieId:', movieId);//debug

            await usersCollection.updateOne(
                { username: req.session.user.username },
                { $addToSet: { favorites: movieId } }
            );
  
            return res.json({ success: true, message: 'Movie added to favorites' });
        }
        catch(error){
            console.error('Error in /favorites/add:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    favoritesRoutes.post('/favorites/remove', async (req, res) => {
        try{
            if(!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  
            const { movieId } = req.body;
  
            if(!movieId) return res.status(400).json({ success: false, message: 'No movie ID provided.' });
  
            //console.log('Received movieId to remove:', movieId);//debug

            await usersCollection.updateOne(
                                { username: req.session.user.username },
                                { $pull: { favorites: movieId } } 
            );

            return res.json({ success: true, message: 'Movie removed from favorites' });
        } 
        catch(error){
            console.error('Error in /favorites/remove:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    return favoritesRoutes;
}