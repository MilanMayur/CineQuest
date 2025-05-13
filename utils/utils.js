export function getSortOption(sort) {
    switch (sort) {
        case 'title': return { title: 1 };
        case 'rating': return { 'imdb.rating': -1 };
        case 'year': return { released: -1 };
        default: return {};
    }
}

