document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error("Firebase not initialized. Ensure firebase-config.js is loaded before global-connections-loader.js.");
        const partnershipsGrid = document.getElementById('dynamic-partnerships-grid');
        if (partnershipsGrid) {
            partnershipsGrid.innerHTML = '<p style="color:red; text-align:center;">Error: Firebase not configured. Global connections cannot be loaded.</p>';
        }
        return;
    }

    const db = firebase.firestore();
    const gcCollection = db.collection('global_connections_homepage');
    const partnershipsGrid = document.getElementById('dynamic-partnerships-grid');

    if (!partnershipsGrid) {
        console.error("Error: The container '#dynamic-partnerships-grid' was not found in the HTML.");
        return;
    }

    gcCollection.orderBy('order', 'asc').get()
        .then(snapshot => {
            if (snapshot.empty) {
                partnershipsGrid.innerHTML = '<p style="text-align:center;">No global connections to display at the moment.</p>';
                return;
            }

            let htmlContent = '';
            snapshot.forEach(doc => {
                const item = doc.data();
                // Basic validation
                if (item.name && item.description && item.imageUrl) {
                    htmlContent += `
                        <div class="partnership-card">
                            <img src="${item.imageUrl}" alt="${item.name}" loading="lazy">
                            <h3>${item.name}</h3>
                            <p>${item.description}</p>
                        </div>
                    `;
                } else {
                    console.warn("Skipping a global connection item due to missing fields:", item);
                }
            });

            if (htmlContent === '') { // Handles case where items exist but all are invalid
                 partnershipsGrid.innerHTML = '<p style="text-align:center;">No valid global connections to display.</p>';
            } else {
                partnershipsGrid.innerHTML = htmlContent;
            }

        })
        .catch(error => {
            console.error("Error fetching global connections:", error);
            partnershipsGrid.innerHTML = '<p style="color:red; text-align:center;">Could not load global connections due to an error. Please try again later.</p>';
        });
});
