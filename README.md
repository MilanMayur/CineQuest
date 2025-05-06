# 🎬 CineQuest
CineQuest is a movie discovery app where users can explore, search, and filter movies, submit ratings and reviews, and manage favorites. With user profiles, dark mode, and personalized features, CineQuest offers a fun and interactive way to find and track your favorite films.

## 🚀 Features

- 🔍 Search movies by title, actor, genre
- 🎯 Filter by year, IMDb rating, and sort results
- ⭐ Favorite and unfavorite movies
- 📝 Submit and manage reviews with ratings
- 👤 User authentication (signup/login/logout)
- ⚙️ Profile settings with password change and account deletion
- 🌙 Dark mode support
- 📄 Paginated listings for movies, favorites, and reviews
- ⚠️ Flash messages for success/error notifications

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** EJS (Embedded JavaScript), Vanilla JavaScript, CSS
- **Database:** MongoDB
- **Session Management:** express-session with connect-mongo
- **Security:** bcrypt for password hashing
- **Logging:** Winston

## 📦 Installation

1. **Clone the repository**
2. **Install dependencies**
3. **Set up environment variables:**
   ATLAS_URI=mongodb+srv://your-user:your-password@your-cluster.mongodb.net/movie_db
4. **Run the application**

## Project Structure

├── routes/               # Route files (auth, movies, user, favorites)

├── views/                # EJS templates

├── public/               # Static assets (styles.css, JS, images)

├── utils/                # Utility functions (e.g., sorting)

├── server.mjs            # App entry point

├── .env                  # Environment variables

├── package.json
