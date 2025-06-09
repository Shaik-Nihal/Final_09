document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase is initialized before trying to use its services
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error("Firebase not initialized. Make sure firebase-config.js is loaded before accreditations-loader.js and is configured correctly.");
        const logosContainer = document.getElementById('dynamic-accreditation-logos');
        if (logosContainer) {
            logosContainer.innerHTML = '<p style="color:red; text-align:center;">Error: Firebase not configured. Accreditations cannot be loaded.</p>';
        }
        return;
    }

    const db = firebase.firestore();
    const accreditationsCollection = db.collection('accreditations_homepage');
    const logosContainer = document.getElementById('dynamic-accreditation-logos');
    const LOCAL_STORAGE_KEY = 'accreditationsCache';

    if (!logosContainer) {
        console.error("Error: The container '#dynamic-accreditation-logos' was not found in the HTML.");
        return;
    }

    function renderAccreditations(data, container) {
        container.innerHTML = ''; // Clear previous content

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center;">No accreditations or affiliations to display at the moment.</p>';
            return;
        }

        let htmlContent = '';
        data.forEach(item => {
            if (item.name && item.logoUrl) {
                htmlContent += `
                    <div class="logo-item">
                        <img src="${item.logoUrl}" alt="${item.name} Logo" loading="lazy">
                        <span>${item.name}</span>
                    </div>
                `;
            } else {
                console.warn("Skipping an accreditation item due to missing name or logoUrl:", item);
            }
        });

        if (htmlContent === '') {
            container.innerHTML = '<p style="text-align:center;">No valid accreditations to display.</p>';
        } else {
            container.innerHTML = htmlContent;
        }
    }

    let renderedFromCache = false;
    try {
        const cachedDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cachedDataString) {
            const cachedData = JSON.parse(cachedDataString);
            if (cachedData && Array.isArray(cachedData)) { // Array specific check
                renderAccreditations(cachedData, logosContainer);
                renderedFromCache = true;
                console.log(`Loaded ${LOCAL_STORAGE_KEY} from cache.`);
            }
        }
    } catch (e) {
        console.error(`Error reading or parsing ${LOCAL_STORAGE_KEY} from cache:`, e);
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear potentially corrupted cache
    }

    if (!renderedFromCache) {
        // Optional: Show a loading message if nothing was rendered from cache
        // logosContainer.innerHTML = '<p style="text-align:center;">Loading accreditations...</p>';
    }

    accreditationsCollection.orderBy('order', 'asc').get()
        .then(snapshot => {
            const firestoreDataArray = [];
            snapshot.forEach(doc => {
                firestoreDataArray.push(doc.data());
            });

            const currentCacheString = localStorage.getItem(LOCAL_STORAGE_KEY);
            const newFirestoreDataString = JSON.stringify(firestoreDataArray);

            if (currentCacheString !== newFirestoreDataString) {
                console.log(`Data for ${LOCAL_STORAGE_KEY} has changed or cache was empty/invalid. Rendering from Firestore.`);
                renderAccreditations(firestoreDataArray, logosContainer);
                localStorage.setItem(LOCAL_STORAGE_KEY, newFirestoreDataString);
                console.log(`Updated ${LOCAL_STORAGE_KEY} in cache.`);
            } else if (!renderedFromCache) {
                console.log(`Cache for ${LOCAL_STORAGE_KEY} was not rendered (e.g. empty but valid, or corrupted). Rendering current Firestore data.`);
                renderAccreditations(firestoreDataArray, logosContainer);
                 // Ensure cache is populated if it was initially empty or corrupted
                if (!currentCacheString) localStorage.setItem(LOCAL_STORAGE_KEY, newFirestoreDataString);
            } else {
                console.log(`Data for ${LOCAL_STORAGE_KEY} is unchanged from cache. No UI update needed.`);
            }
        })
        .catch(error => {
            console.error(`Error fetching ${LOCAL_STORAGE_KEY} from Firestore:`, error);
            if (!renderedFromCache) {
                logosContainer.innerHTML = '<p style="color:red; text-align:center;">Could not load accreditations due to an error. Please try again later.</p>';
            } else {
                console.warn(`Failed to update ${LOCAL_STORAGE_KEY} from Firestore. Displaying cached version.`);
            }
        });
});
