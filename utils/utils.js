export function getSortOption(sort) {
    switch (sort) {
        case 'title': return { title: 1 };
        case 'rating': return { sortField: { 'imdb.rating': -1 }, isNumericRating: true };
        case 'year': return { released: -1 };
        default: return {};
    }
}

