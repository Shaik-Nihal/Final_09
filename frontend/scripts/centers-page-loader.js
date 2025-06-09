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
    const dedicatedMapsContainer = document.getElementById('dedicated-campus-maps-container');
    const LOCAL_STORAGE_KEY = 'centersPageCache';

    if (!centersListingContainer) {
        console.error("Error: The container '#dynamic-centre-cards-listing' was not found in centres/index.html.");
        // No return here, as the maps container might still exist
    }
    if (!dedicatedMapsContainer) {
        console.error("Error: The container '#dedicated-campus-maps-container' was not found in centres/index.html.");
    }

    function renderCenterListings(data, container) {
        if (!container) return; // Guard against missing container
        container.innerHTML = ''; // Clear previous content

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding: 20px;">Details about our centers will be updated soon. Please check back later.</p>';
            return;
        }

        let htmlContent = '';
        data.forEach(center => {
            if (center.name && center.imageUrl && center.description && center.pageUrl) {
                htmlContent += `
                    <div class="centre">
                        <div class="centre-image">
                            <img src="${center.imageUrl}" alt="${center.name} Centre" loading="lazy">
                        </div>
                        <div class="centre-details">
                            <h2>${center.name}</h2>
                            <p class="centre-description">${center.description}</p>
                            <a href="${center.pageUrl.startsWith('/') ? '' : '/'}${center.pageUrl}" class="btn">View Details</a>
                            <!-- Map embed is removed from here -->
                        </div>
                    </div>
                `;
            } else {
                console.warn("Skipping a center item for the listing page due to missing essential fields:", center);
            }
        });

        if (htmlContent === '') {
            container.innerHTML = '<p style="text-align:center; padding: 20px;">Currently, no center information is available in the required format for the listing page.</p>';
        } else {
            container.innerHTML = htmlContent;
        }
    }

    function renderDedicatedMaps(data, container) {
        if (!container) return; // Guard against missing container
        container.innerHTML = ''; // Clear previous static/cached content

        if (!data || data.length === 0) {
            // No message needed here usually, or it could be a general "Our Campuses" title if the container is purely for maps
            return;
        }

        let mapHtmlContent = '';
        data.forEach(center => {
            if (center.name && center.mapEmbedCode && center.mapEmbedCode.trim().startsWith('<iframe')) {
                mapHtmlContent += `
                    <div class="campus">
                        <h2>${center.name} Campus</h2>
                        ${center.mapEmbedCode}
                        <!-- Placeholder for other details if needed from CMS in future -->
                    </div>
                `;
            } else {
                 console.warn(`Map embed code missing or invalid for center: ${center.name}`);
            }
        });

        if (mapHtmlContent === '') {
            container.innerHTML = '<p style="text-align:center; padding: 20px;">Campus map information will be available soon.</p>';
        } else {
            container.innerHTML = mapHtmlContent;
        }
    }

    function renderAllCenterData(data) {
        renderCenterListings(data, centersListingContainer);
        renderDedicatedMaps(data, dedicatedMapsContainer);
    }

    let renderedFromCache = false;
    try {
        const cachedDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cachedDataString) {
            const cachedData = JSON.parse(cachedDataString);
            if (cachedData && Array.isArray(cachedData)) {
                renderAllCenterData(cachedData);
                renderedFromCache = true;
                console.log(`Loaded ${LOCAL_STORAGE_KEY} from cache.`);
            }
        }
    } catch (e) {
        console.error(`Error reading or parsing ${LOCAL_STORAGE_KEY} from cache:`, e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }

    if (!renderedFromCache && centersListingContainer) { // Only show loading in main list if not cached
        // centersListingContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Loading centers...</p>';
    }

    centersCollection.orderBy('order', 'asc').get()
        .then(snapshot => {
            const firestoreDataArray = [];
            snapshot.forEach(doc => {
                firestoreDataArray.push(doc.data());
            });

            const currentCacheString = localStorage.getItem(LOCAL_STORAGE_KEY);
            const newFirestoreDataString = JSON.stringify(firestoreDataArray);

            if (currentCacheString !== newFirestoreDataString) {
                console.log(`Data for ${LOCAL_STORAGE_KEY} has changed or cache was empty/invalid. Rendering from Firestore.`);
                renderAllCenterData(firestoreDataArray);
                localStorage.setItem(LOCAL_STORAGE_KEY, newFirestoreDataString);
                console.log(`Updated ${LOCAL_STORAGE_KEY} in cache.`);
            } else if (!renderedFromCache) {
                console.log(`Cache for ${LOCAL_STORAGE_KEY} was not rendered. Rendering current Firestore data.`);
                renderAllCenterData(firestoreDataArray);
                if(!currentCacheString) localStorage.setItem(LOCAL_STORAGE_KEY, newFirestoreDataString);
            } else {
                console.log(`Data for ${LOCAL_STORAGE_KEY} is unchanged from cache. No UI update needed.`);
            }
        })
        .catch(error => {
            console.error(`Error fetching ${LOCAL_STORAGE_KEY} from Firestore:`, error);
            if (!renderedFromCache && centersListingContainer) {
                centersListingContainer.innerHTML = '<p style="color:red; text-align:center; padding: 20px;">Could not load center listings due to an error. Please try again later.</p>';
            }
            // Dedicated maps container might also show an error or rely on its default state if cache didn't render for it.
            if (!renderedFromCache && dedicatedMapsContainer) {
                 dedicatedMapsContainer.innerHTML = '<p style="color:red; text-align:center; padding: 20px;">Could not load campus maps due to an error.</p>';
            }
            if (renderedFromCache) {
                 console.warn(`Failed to update ${LOCAL_STORAGE_KEY} from Firestore. Displaying cached version.`);
            }
        });
});
