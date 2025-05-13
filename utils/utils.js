export function getSortOption(sort) {
    switch (sort) {
        case 'title': return { sortOption: { title: 1 }, isNumericRating: false };
        case 'rating': return { sortOption: { 'imdb.rating': -1 }, isNumericRating: true };
        case 'year': return { sortOption: { released: -1 }, isNumericRating: false };
        default: return { sortOption: { released: -1 }, isNumericRating: false };
    }
}

