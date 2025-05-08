export function getSortOption(sort) {
    switch (sort) {
        case 'title': return { movieName: 1 };
        case 'rating': return { imdbRating: -1 };
        case 'year': return { releaseDate: -1 };
        default: return {};
    }
}

