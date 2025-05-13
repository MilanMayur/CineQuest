export function toggleDarkMode(){
    const toggle = document.getElementById('darkModeToggle');
    const isDark = localStorage.getItem('darkMode') === 'true';

    if (isDark) {
        document.documentElement.classList.add('dark-mode');
        toggle.innerText = '☀️';
    }

    toggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark-mode');
        const enabled = document.documentElement.classList.contains('dark-mode');
        toggle.innerText = enabled ? '☀️' : '🌙';
        localStorage.setItem('darkMode', enabled); 
    });
}

export function setupStarRating() {
    const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('ratingInput');
    
  
    stars.forEach((star) => {
        const value = parseInt(star.dataset.value);

        star.addEventListener('click', (e) => {
            e.preventDefault();
            ratingInput.value = value;

            stars.forEach((s) => {
                const sValue = parseInt(s.dataset.value);
                s.classList.toggle('selected', sValue <= value);
            });
        });

        star.addEventListener('mouseenter', () => {
            const hoverValue = parseInt(e.target.dataset.value);
            stars.forEach((s) => {
                const sValue = parseInt(s.dataset.value);
                s.classList.toggle('hover', sValue <= hoverValue);
            });
        });

        star.addEventListener('mouseleave', () => {
            stars.forEach((s) => s.classList.remove('hover'));
        });
    });
}
  
export function autoHideMessages() {
    setTimeout(() => {
        const successMsg = document.querySelector('.success-message');
        if (successMsg) successMsg.style.display = 'none';
    }, 3000);

    setTimeout(() => {
        const errorMsg = document.querySelector('.error-message');
        if (errorMsg) errorMsg.style.display = 'none';
    }, 3000);
}

export function goBack() {
    window.history.back();
}

export function setupFavoritesButton(){
    const favForm = document.getElementById('favForm');
    const favButton = document.getElementById('favButton');
    const actionTypeInput = document.getElementById('actionType');

    if(favForm && favButton && actionTypeInput){
        favForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // no reload
            favButton.disabled = true;
            favButton.innerText = "Processing...";

            try{
                const formData = new FormData(favForm);
                const movieId = formData.get('movieId');
                const actionType = actionTypeInput.value;
                const url = actionType === 'remove' ? '/favorites/remove' : '/favorites/add';
                
                console.log('Action:', actionType); //
                
                const response = await fetch(url, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ movieId })
                                });
                
                console.log('Sending request to:', url, 'with movieId:', movieId);

                if(response.ok){
                    if(actionType === 'remove'){
                        favButton.innerText = "⭐ Add to Favorites";
                        actionTypeInput.value = "add";
                    } 
                    else{
                        favButton.innerText = "✅ Remove from Favorites";
                        actionTypeInput.value = "remove";
                    } 
                    
                    favButton.disabled = false;
                }
                else{
                    favButton.innerText = "Error";
                }
            } 
            catch(error){
                console.error('Error processing favorite:', error);
                favButton.innerText = "Error";
            }
        });
    }   
}

export function validateSearchForm(){
    const query = document.getElementById('searchQuery').value.trim();
    if(!query) return false;
    return true;
}

export function confirmDelete(){
    return confirm('⚠️ Are you sure you want to delete your account? This action cannot be undone!');
}

export function handleEnterKey(event){
    const query = document.getElementById('searchInput').value.trim();
    if(query && event.key === 'Enter'){
        window.location.href = '/search/' + encodeURIComponent(query);
    }
    else if(event.key === 'Enter'){
        event.preventDefault();
    }
}

export function handleSearchEnterKey(event){
    if(event.key === 'Enter') searchMovies();
}

export function handleFilterEnterKey(event){
    if(event.key === 'Enter') applyFilters();
}

export function updateFilterButtonState(){
    const year = document.getElementById('yearFilter').value.trim();
    const rating = document.getElementById('ratingFilter').value.trim();
    document.getElementById('applyFilterButton').disabled = !(year || rating);
}

/*export function applyFilters(){
    const year = document.getElementById('yearFilter').value.trim();
    const rating = document.getElementById('ratingFilter').value.trim();
    const queryParams = [];
    if(year){
        queryParams.push(`year=${encodeURIComponent(year)}`);
    }
    if(rating){
        queryParams.push(`rating=${encodeURIComponent(rating)}`);
    }
    const queryString = queryParams.length ? '?' + queryParams.join('&') : '';
    window.location.href = '/filter' + queryString;
}*/

export function applyFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const year = document.getElementById('yearFilter').value.trim();
    const rating = document.getElementById('ratingFilter').value.trim();
    const sort = document.getElementById('sortSelect').value;
    const searchTerm = document.getElementById('searchInput').value.trim();
    const currentPath = window.location.pathname;
    let basePath = '/filter';

    if(currentPath.startsWith('/search/')) basePath = currentPath; 

    if(year) urlParams.set('year', year);
    else urlParams.delete('year');

    if(rating) urlParams.set('rating', rating);
    else urlParams.delete('rating');
    
    if(sort) urlParams.set('sort', sort);
    else urlParams.delete('sort');

    if(searchTerm) urlParams.set('query', searchTerm);
    else urlParams.delete('query');

    urlParams.set('page', 1);
    window.location.href = `${basePath}?${urlParams.toString()}`;
}

export function clearFilters(){
    const basePath = window.location.pathname;
    window.location.href = basePath;
}

export function searchMovies(){
    const query = document.getElementById('searchInput').value.trim();
    const sort = document.getElementById('sortSelect').value;
    if(query){
        const queryParams = [];
        if(sort){
            queryParams.push(`sort=${encodeURIComponent(sort)}`);
        }
        const queryString = queryParams.length ? '?' + queryParams.join('&') : '';
        window.location.href = `/search/${encodeURIComponent(query)}${queryString}`;
    }
}

export function checkAndReloadCSS() {
    const test = document.createElement('div');
    test.id = 'css-test';
    test.style.display = 'none';
    test.style.width = '123px'; // Expect this width to be overridden by CSS
    document.body.appendChild(test);

    window.addEventListener('load', () => {
        const computedWidth = window.getComputedStyle(test).width;
        if (computedWidth !== '123px') {
            console.warn('⚠️ CSS may not have loaded. Reloading stylesheets...');
            reloadStylesheets();
        }
        document.body.removeChild(test); // Clean up
    });

    function reloadStylesheets() {
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const newLink = link.cloneNode();
            newLink.href = link.href.split('?')[0] + '?reload=' + new Date().getTime();
            link.replaceWith(newLink);
        });
    }
}

/*export function setupReviewForm() {
    const reviewForm = document.querySelector('.review-form');
    if(!reviewForm) return;

    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(reviewForm);
        const rating = formData.get('rating');
        const comment = formData.get('review');
        const movieId = window.location.pathname.split('/').pop();

        try{
            const res = await fetch(`/movies/${movieId}/review`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rating, review: comment })
            });

            const data = await res.json();

            const msgBox = document.createElement('div');
            //const msgBox = document.querySelector('.success-message');
            msgBox.className = data.success ? 'success-message' : 'error-message';
            msgBox.innerText = data.message;
            document.body.prepend(msgBox);
            setTimeout(() => msgBox.remove(), 3000);

            if(data.success) reviewForm.reset();
        }
        catch(error){
            console.error('Review error:', error);
        }
    });
}*/

