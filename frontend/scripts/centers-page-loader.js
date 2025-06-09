document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase is initialized before trying to use its services
    // It's crucial that firebase-config.js is loaded and executed before this script.
    // This script might be in a different directory, so path to firebase-config.js might need checking if issues arise.
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error("Firebase not initialized. Ensure firebase-config.js is loaded before centers-page-loader.js and paths are correct.");
        const centersListingContainer = document.getElementById('dynamic-centre-cards-listing');
        if (centersListingContainer) {
            centersListingContainer.innerHTML = '<p style="color:red; text-align:center;">Error: Firebase not configured. Center listings cannot be loaded.</p>';
        }
        return;
    }

    const db = firebase.firestore();
    const centersCollection = db.collection('centers_list');
    const centersListingContainer = document.getElementById('dynamic-centre-cards-listing');

    if (!centersListingContainer) {
        console.error("Error: The container '#dynamic-centre-cards-listing' was not found in centres/index.html.");
        return;
    }

    centersCollection.orderBy('order', 'asc').get()
        .then(snapshot => {
            if (snapshot.empty) {
                centersListingContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Details about our centers will be updated soon. Please check back later.</p>';
                return;
            }

            let htmlContent = '';
            snapshot.forEach(doc => {
                const center = doc.data();
                // Basic validation for essential fields from Firestore
                if (center.name && center.imageUrl && center.description && center.pageUrl) {
                    // Construct the card HTML based on the structure in centres/index.html
                    // For now, we only use fields available in the 'centers_list' collection
                    htmlContent += `
                        <div class="centre">
                            <div class="centre-image">
                                <img src="${center.imageUrl}" alt="${center.name} Centre" loading="lazy">
                            </div>
                            <div class="centre-details">
                                <h2>${center.name}</h2>
                                <p class="centre-description">${center.description}</p>
                                <!-- Placeholder for centre-info and centre-facilities as they are not in Firestore -->
                                <!--
                                <div class="centre-info">
                                    <div class="info-item"><i class="fas fa-map-marker-alt"></i><p>Address not available</p></div>
                                    <div class="info-item"><i class="fas fa-phone"></i><p>Phone not available</p></div>
                                    <div class="info-item"><i class="fas fa-envelope"></i><p>Email not available</p></div>
                                </div>
                                <div class="centre-facilities">
                                    <h3>Key Facilities</h3>
                                    <ul><li>Details coming soon...</li></ul>
                                </div>
                                -->
                                <a href="${center.pageUrl.startsWith('/') ? '' : '/'}${center.pageUrl}" class="btn">View Details</a>
                            </div>
                        </div>
                    `;
                } else {
                    console.warn("Skipping a center item for the listing page due to missing essential fields:", center);
                }
            });

            if (htmlContent === '') {
                 centersListingContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Currently, no center information is available in the required format for the listing page.</p>';
            } else {
                centersListingContainer.innerHTML = htmlContent;
            }

        })
        .catch(error => {
            console.error("Error fetching centers for listing page:", error);
            centersListingContainer.innerHTML = '<p style="color:red; text-align:center; padding: 20px;">Could not load center listings due to an error. Please try again later.</p>';
        });
});
