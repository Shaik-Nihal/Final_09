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
    const LOCAL_STORAGE_KEY = 'homepageCentersCache';

    if (!centersContainer) {
        console.error("Error: The container '#dynamic-centre-cards-homepage' was not found in the HTML.");
        return;
    }

    function renderHomepageCenters(data, container) {
        container.innerHTML = ''; // Clear previous content

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center;">Information about our centers will be available soon.</p>';
            return;
        }

        let htmlContent = '';
        data.forEach(center => {
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
                console.warn("Skipping a homepage center item due to missing fields:", center);
            }
        });

        if (htmlContent === '') {
            container.innerHTML = '<p style="text-align:center;">Currently, no center information is available in the required format.</p>';
        } else {
            container.innerHTML = htmlContent;
        }
    }

    let renderedFromCache = false;
    try {
        const cachedDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cachedDataString) {
            const cachedData = JSON.parse(cachedDataString);
            if (cachedData && Array.isArray(cachedData)) {
                renderHomepageCenters(cachedData, centersContainer);
                renderedFromCache = true;
                console.log(`Loaded ${LOCAL_STORAGE_KEY} from cache.`);
            }
        }
    } catch (e) {
        console.error(`Error reading or parsing ${LOCAL_STORAGE_KEY} from cache:`, e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }

    if (!renderedFromCache) {
        // centersContainer.innerHTML = '<p style="text-align:center;">Loading center information...</p>';
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
                renderHomepageCenters(firestoreDataArray, centersContainer);
                localStorage.setItem(LOCAL_STORAGE_KEY, newFirestoreDataString);
                console.log(`Updated ${LOCAL_STORAGE_KEY} in cache.`);
            } else if (!renderedFromCache) {
                console.log(`Cache for ${LOCAL_STORAGE_KEY} was not rendered. Rendering current Firestore data.`);
                renderHomepageCenters(firestoreDataArray, centersContainer);
                 if(!currentCacheString) localStorage.setItem(LOCAL_STORAGE_KEY, newFirestoreDataString);
            } else {
                console.log(`Data for ${LOCAL_STORAGE_KEY} is unchanged from cache. No UI update needed.`);
            }
        })
        .catch(error => {
            console.error(`Error fetching ${LOCAL_STORAGE_KEY} from Firestore:`, error);
            if (!renderedFromCache) {
                centersContainer.innerHTML = '<p style="color:red; text-align:center;">Could not load center information due to an error. Please try again later.</p>';
            } else {
                console.warn(`Failed to update ${LOCAL_STORAGE_KEY} from Firestore. Displaying cached version.`);
            }
        });
});
