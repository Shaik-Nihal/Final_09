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
    const LOCAL_STORAGE_KEY = 'globalConnectionsCache';

    if (!partnershipsGrid) {
        console.error("Error: The container '#dynamic-partnerships-grid' was not found in the HTML.");
        return;
    }

    function renderGlobalConnections(data, container) {
        container.innerHTML = ''; // Clear previous content

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center;">No global connections to display at the moment.</p>';
            return;
        }

        let htmlContent = '';
        data.forEach(item => {
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

        if (htmlContent === '') {
            container.innerHTML = '<p style="text-align:center;">No valid global connections to display.</p>';
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
                renderGlobalConnections(cachedData, partnershipsGrid);
                renderedFromCache = true;
                console.log(`Loaded ${LOCAL_STORAGE_KEY} from cache.`);
            }
        }
    } catch (e) {
        console.error(`Error reading or parsing ${LOCAL_STORAGE_KEY} from cache:`, e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }

    if (!renderedFromCache) {
        // partnershipsGrid.innerHTML = '<p style="text-align:center;">Loading global connections...</p>';
    }

    gcCollection.orderBy('order', 'asc').get()
        .then(snapshot => {
            const firestoreDataArray = [];
            snapshot.forEach(doc => {
                firestoreDataArray.push(doc.data());
            });

            const currentCacheString = localStorage.getItem(LOCAL_STORAGE_KEY);
            const newFirestoreDataString = JSON.stringify(firestoreDataArray);

            if (currentCacheString !== newFirestoreDataString) {
                console.log(`Data for ${LOCAL_STORAGE_KEY} has changed or cache was empty/invalid. Rendering from Firestore.`);
                renderGlobalConnections(firestoreDataArray, partnershipsGrid);
                localStorage.setItem(LOCAL_STORAGE_KEY, newFirestoreDataString);
                console.log(`Updated ${LOCAL_STORAGE_KEY} in cache.`);
            } else if (!renderedFromCache) {
                console.log(`Cache for ${LOCAL_STORAGE_KEY} was not rendered. Rendering current Firestore data.`);
                renderGlobalConnections(firestoreDataArray, partnershipsGrid);
                if(!currentCacheString) localStorage.setItem(LOCAL_STORAGE_KEY, newFirestoreDataString);
            } else {
                console.log(`Data for ${LOCAL_STORAGE_KEY} is unchanged from cache. No UI update needed.`);
            }
        })
        .catch(error => {
            console.error(`Error fetching ${LOCAL_STORAGE_KEY} from Firestore:`, error);
            if (!renderedFromCache) {
                partnershipsGrid.innerHTML = '<p style="color:red; text-align:center;">Could not load global connections due to an error. Please try again later.</p>';
            } else {
                console.warn(`Failed to update ${LOCAL_STORAGE_KEY} from Firestore. Displaying cached version.`);
            }
        });
});
