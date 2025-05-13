import express from 'express';
import { ObjectId } from 'mongodb';
import { getSortOption } from '../utils/utils.js';


export function createMovieRouter(moviesCollection, usersCollection, commentsCollection) {
    
    const movieRoutes = express.Router();

    movieRoutes.get('/home', async (req, res) => {
        try {
            const successMessage = req.cookies.successMessage || res.locals.successMessage || null;
            res.clearCookie('successMessage');
            const errorMessage = res.locals.errorMessage || null;

            //console.log('In /home- successMessage: ', successMessage);//debug
            //console.log('In /home- errorMessage: ', errorMessage);//debug

            const page = parseInt(req.query.page) || 1;
            const itemsPerPage = 20;
            const skip = (page - 1) * itemsPerPage;
            const totalMovies = await moviesCollection.countDocuments();
            const movieData = await moviesCollection.find()
                                    .sort({ released: -1 })
                                    .skip(skip)
                                    .limit(itemsPerPage)
                                    .toArray();

            res.status(200).set({'Content-Type': 'text/html'}).render('index', { 
                            movieData,
                            currentPage: page,
                            totalPages: Math.ceil(totalMovies / itemsPerPage),
                            resultCount: totalMovies,
                            fromFilter: false,
                            year: '',
                            rating: '',
                            sort: '',
                            searchTerm: '',
                            query: req.query,
                            currentPath: req.path,
                            user: req.session.user,
                            successMessage,
                            errorMessage
            });
        } 
        catch(error){
            console.error('Error in /home', error);
            res.status(500).send("Error fetching movies: " + error.message);
        }
    });

    movieRoutes.get('/movie/:id', async (req, res, next) => {
        try{
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            const id = req.params.id;

            if(!ObjectId.isValid(id)){
                return res.status(400).send('Invalid movie ID format');
            }

            const movieId = {_id: ObjectId.createFromHexString(id)};
            const movie = await moviesCollection.findOne({_id: movieId._id});

            if(!movie){
                console.log(`Movie with ID ${movie._id} not found.`);
                return res.status(404).send("Movie not found");
            }

            let userFavorites = [];
            let alreadyFavorited = false;

            if(req.session.user){
                const userData = await usersCollection.findOne({ email: req.session.user.email });
                userFavorites = userData?.favorites || [];
                alreadyFavorited = userFavorites.includes(movie._id.toString());
            }

            req.session.prevPage = req.get('Referrer') || '/home';

            res.status(200).set({'Content-Type': 'text/html'}).render('details', { 
                            movie, 
                            user: req.session.user,
                            alreadyFavorited,
                            backUrl: req.query.from || '/home' 
            });
        }
        catch(error){
            error.message = 'Error fetching movie(s)!';
            next(error);
        }
    });

    movieRoutes.post('/movies/:id/review', async (req, res, next) => {
        try{
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            
            if(!req.session.user) return res.redirect('/login');

            const { rating, review } = req.body;
            const movieId = req.params.id;
            const email = req.session.user.email;

            const movie = await moviesCollection.findOne({ _id: new ObjectId(movieId) });

            const alreadyReviewed = movie.reviews?.some(rev => rev.email === email);

            if(alreadyReviewed){
                req.session.errorMessage = "You have already submitted a review for this movie.";
                return res.redirect(`/movie/${movieId}`);
            }

            const newReview = {
                            name: req.session.user.name,
                            email,
                            rating: parseInt(rating),
                            comment: review,
                            date: new Date()
            };

            await moviesCollection.updateOne(
                            { _id: new ObjectId(movieId) },
                            { $push: { reviews: newReview } }
            );

            req.session.successMessage = "Review submitted successfully!";
            //console.log(req.session.lastPage);//debug
            return res.redirect(req.session.lastPage || `/movie/${movieId}`);
        } 
        catch(error){
            error.message = 'Error submitting review';
            next(error);
        }
    });

    movieRoutes.post('/movies/:id/review/delete', async (req, res, next) => {
        try{
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            if (!req.session.user) return res.redirect('/login');
        
            const movieId = req.params.id;
            const reviewIndex = parseInt(req.body.reviewIndex);
            const email = req.session.user.email;
        
            const movie = await moviesCollection.findOne({ _id: new ObjectId(movieId) });
            const review = movie.reviews[reviewIndex];

            if(!movie || !movie.reviews || !review){
                req.session.errorMessage = 'Review not found!';
                return res.redirect('/movies');
            }
        
            if(review.email !== email){
                req.session.errorMessage = 'You can only delete your own reviews.';
                return res.redirect(`/movie/${movieId}`);
            }
        
            movie.reviews.splice(reviewIndex, 1);
            await moviesCollection.updateOne(
                                { _id: new ObjectId(movieId) },
                                { $set: { reviews: movie.reviews } }
            );
        
            req.session.successMessage = 'Review deleted successfully!';
            res.redirect(`/movie/${movieId}`);
        } 
        catch(error){
            error.message = 'Error deleting review!';
            next(error);
        }
    });

    movieRoutes.get('/search', (req, res, next) => {
        try{
            const query = req.query.query;

            if(!query || query.trim() === '') return res.redirect('/');

            res.redirect(`/search/${encodeURIComponent(query.trim())}`);
        }
        catch(error){
            error.message = 'Error fetching movie(s)!';
            next(error);
        }
    });

    movieRoutes.get('/search/:query', async (req, res, next) => {
        try{
            const searchResult = (req.params.query)?.toLowerCase() || "";
            const words = searchResult.trim().split(/\s+/);
            const { year, rating, sort = '', page = 1, query } = req.query;
            const itemsPerPage = 20;
            const skip = (page - 1) * itemsPerPage;

            //console.log("Sort param received:", sort);//debug

            const wordFilters = words.map(word => ({
                $or: [
                    { title: { $regex: word, $options: "i" } },
                    { cast: { $regex: `\\b${word}\\b`, $options: "i" } },
                    { genres: { $regex: `\\b${word}\\b`, $options: "i" } },
                    { directors: { $regex: `\\b${word}\\b`, $options: "i" } }
                ]
            }));

            const searchFilter = { $or: wordFilters };

            if(year || rating) searchFilter.$and = [];
            if(year) searchFilter.$and.push({ released: { $regex: year } });
            if(rating) searchFilter.$and.push({ 'imdb.rating': { $gte: parseFloat(rating) } });

            const sortOption = getSortOption(sort);
            const movieData = await moviesCollection.find(searchFilter)
                                                    .sort(sortOption)
                                                    .skip(skip)
                                                    .limit(itemsPerPage)
                                                    .toArray();
  
            const totalMovies = await moviesCollection.countDocuments(searchFilter);
            
            console.log('User:',req.session.user);

            res.status(200).set({'Content-Type': 'text/html'}).render('index', { 
                            movieData,
                            resultCount: totalMovies,
                            currentPage: page,
                            totalPages: Math.ceil(totalMovies / itemsPerPage),
                            fromFilter: true,
                            year,
                            rating,
                            sort,
                            searchResult,
                            query,
                            currentPath: req.path,
                            user: req.session.user
            });
        } 
        catch(error){
            error.message = 'Error fetching movie(s)!';
            next(error);
        }
    });
  
    movieRoutes.get('/filter', async (req, res, next) => {
        try {
            const { year, rating, sort = '', page = 1, query } = req.query;
            const searchResult = (req.params.query)?.toLowerCase() || "";
            const itemsPerPage = 20;
            const skip = (page - 1) * itemsPerPage;
            const filterConditions = [];
            console.log("Filter query:", query);

            if(query){
                filterConditions.push({
                    $or: [
                        { title: { $regex: query, $options: 'i' } },
                        { cast: { $elemMatch: { $regex: query, $options: 'i' } } },
                        { genres: { $regex: query, $options: 'i' } },
                        { directors: { $regex: query, $options: 'i' } }
                    ]
                });
            }

            if(year) filterConditions.push({ released: { $regex: year } });
            if(rating) filterConditions.push({ 'imdb.rating': { $gte: parseFloat(rating) } });

            const filter = filterConditions.length ? { $and: filterConditions } : {};

            const sortOption = getSortOption(sort);

            const movieData = await moviesCollection.find(filter)
                                                    .sort(sortOption)
                                                    .skip(skip)
                                                    .limit(itemsPerPage)
                                                    .toArray();

            const totalMovies = await moviesCollection.countDocuments(filter);

            res.status(200).set({'Content-Type': 'text/html'}).render('index', { 
                            movieData,
                            resultCount: totalMovies,
                            currentPage: parseInt(page),
                            totalPages: Math.ceil(totalMovies / itemsPerPage),
                            fromFilter: true,
                            year,
                            rating,
                            sort,
                            searchResult,
                            query: req.query,
                            currentPath: req.path,
                            user: req.session.user
            });
        } 
        catch(error){
            error.message = 'Error in filtering movies!';
            next(error);
        }
    });

    return movieRoutes;
}
