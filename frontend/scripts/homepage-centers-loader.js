document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error("Firebase not initialized. Ensure firebase-config.js is loaded before homepage-centers-loader.js.");
        const centersContainer = document.getElementById('dynamic-centre-cards-homepage');
        if (centersContainer) {
            centersContainer.innerHTML = '<p style="color:red; text-align:center;">Error: Firebase not configured. Centers cannot be loaded.</p>';
        }
        return;
    }

    const db = firebase.firestore();
    const centersCollection = db.collection('centers_list');
    const centersContainer = document.getElementById('dynamic-centre-cards-homepage');

    if (!centersContainer) {
        console.error("Error: The container '#dynamic-centre-cards-homepage' was not found in the HTML.");
        return;
    }

    centersCollection.orderBy('order', 'asc').get()
        .then(snapshot => {
            if (snapshot.empty) {
                centersContainer.innerHTML = '<p style="text-align:center;">Information about our centers will be available soon.</p>';
                return;
            }

            let htmlContent = '';
            snapshot.forEach(doc => {
                const center = doc.data();
                // Basic validation for essential fields
                if (center.name && center.imageUrl && center.description && center.pageUrl) {
                    htmlContent += `
                        <div class="centre-card">
                            <img src="${center.imageUrl}" alt="${center.name} Centre" loading="lazy">
                            <h3>${center.name}</h3>
                            <p>${center.description}</p>
                            <a href="${center.pageUrl.startsWith('/') ? '' : '/'}${center.pageUrl}" class="btn">View Details</a>
                        </div>
                    `;
                } else {
                    console.warn("Skipping a center item due to missing fields:", center);
                }
            });

            if (htmlContent === '') { // Handles case where items exist but all are invalid
                 centersContainer.innerHTML = '<p style="text-align:center;">Currently, no center information is available in the required format.</p>';
            } else {
                centersContainer.innerHTML = htmlContent;
            }

        })
        .catch(error => {
            console.error("Error fetching centers for homepage:", error);
            centersContainer.innerHTML = '<p style="color:red; text-align:center;">Could not load center information due to an error. Please try again later.</p>';
        });
});
