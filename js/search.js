document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchResultsContainer = document.getElementById('search-results-container');
    let index;

    // Disable input until index is loaded
    searchInput.disabled = true;
    searchInput.placeholder = "Loading...";

    // Initialize FlexSearch
    function initFlexSearch(data) {
        index = new FlexSearch.Document({
            document: {
                id: "permalink",
                index: ["title", "content"],
                store: ["title", "permalink"]
            },
            tokenize: "forward"
        });
        data.forEach(item => {
            index.add(item);
        });
    }

    // Fetch the search index
    fetch('/index.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            initFlexSearch(data);
            searchInput.placeholder = "Search...";
            searchInput.disabled = false;
        })
        .catch(error => {
            console.error('Error fetching or parsing search index:', error);
            searchInput.placeholder = "Search failed to load";
        });

    // Perform search and display results
    function performSearch() {
        if (!index) {
            return;
        }

        const query = searchInput.value;
        if (query.length < 2) {
            searchResults.innerHTML = '';
            searchResultsContainer.style.display = 'none';
            return;
        }

        const results = index.search(query, { limit: 10, enrich: true });
        
        // Combine results from all fields (e.g., title, content) and remove duplicates
        const uniqueIds = new Set();
        const combinedResults = [];
        
        results.forEach(fieldResult => {
            fieldResult.result.forEach(item => {
                if (!uniqueIds.has(item.id)) {
                    uniqueIds.add(item.id);
                    combinedResults.push(item);
                }
            });
        });

        displayResults(combinedResults);
    }

    // Display results in the UI
    function displayResults(results) {
        
        // Clear previous results
        while (searchResults.firstChild) {
            searchResults.removeChild(searchResults.firstChild);
        }

        if (results.length > 0) {
            results.forEach(result => {
                if (result.doc && result.doc.permalink && result.doc.title) {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = result.doc.permalink;
                    a.textContent = result.doc.title;
                    li.appendChild(a);
                    searchResults.appendChild(li);
                }
            });
            searchResultsContainer.style.display = 'block';
        } else {
            const li = document.createElement('li');
            li.textContent = 'No results found';
            searchResults.appendChild(li);
            searchResultsContainer.style.display = 'block';
        }
    }

    searchInput.addEventListener('input', performSearch);

    // Hide results when clicking outside
    document.addEventListener('click', function(event) {
        if (!searchResultsContainer.contains(event.target) && event.target !== searchInput) {
            searchResultsContainer.style.display = 'none';
        }
    });
}); 