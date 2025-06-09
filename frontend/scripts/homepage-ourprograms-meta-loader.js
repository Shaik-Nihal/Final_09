document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error("Firebase not initialized. Ensure firebase-config.js is loaded before homepage-ourprograms-meta-loader.js.");
        // Optionally, provide user feedback on the page itself
        const titleElement = document.getElementById('hp-ourprograms-dynamic-title');
        if (titleElement) {
            titleElement.textContent = "Our Programs (Error: Could not load details)";
        }
        return;
    }

    const db = firebase.firestore();
    const metaDocRef = db.collection('homepage_content').doc('our_programs_section_details');
    const LOCAL_STORAGE_KEY = 'hpOurProgramsMetaCache';

    const titleElement = document.getElementById('hp-ourprograms-dynamic-title');
    const introElement = document.getElementById('hp-ourprograms-dynamic-intro');

    if (!titleElement || !introElement) {
        console.error("Error: Dynamic title or intro paragraph element not found on the homepage.");
        return;
    }

    function renderOurProgramsMeta(data) {
        // Assuming static content is the fallback if specific fields are missing
        if (data && data.title) {
            titleElement.textContent = data.title;
        } else {
            // If data.title is null/undefined, it will keep the static HTML content.
            // Or, explicitly set to default if needed: titleElement.textContent = "Our Programs";
            console.warn("Homepage 'Our Programs' title not found in provided data. Static content may be used.");
        }

        if (data && data.introParagraph) {
            introElement.textContent = data.introParagraph;
        } else {
            // Keep static content or set default
            console.warn("Homepage 'Our Programs' intro paragraph not found in provided data. Static content may be used.");
        }
    }

    let renderedFromCache = false;
    try {
        const cachedDataString = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cachedDataString) {
            const cachedData = JSON.parse(cachedDataString);
            // Check if the object has keys, indicating it's not an empty object from a previous empty save.
            if (cachedData && Object.keys(cachedData).length > 0) {
                renderOurProgramsMeta(cachedData);
                renderedFromCache = true;
                console.log(`Loaded ${LOCAL_STORAGE_KEY} from cache.`);
            } else if (cachedData) { // Cache exists but represents an empty state (e.g. Firestore doc was empty)
                renderOurProgramsMeta(cachedData); // Render the "empty" state (which might just be static content)
                renderedFromCache = true;
            }
        }
    } catch (e) {
        console.error(`Error reading or parsing ${LOCAL_STORAGE_KEY} from cache:`, e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }

    // No explicit "Loading..." message for meta usually, as static content acts as placeholder.

    metaDocRef.get()
        .then(doc => {
            let firestoreDataObject = {};
            if (doc.exists) {
                firestoreDataObject = doc.data();
            } else {
                console.warn(`Document ${LOCAL_STORAGE_KEY} not found in Firestore. Static content will be used/cached as empty.`);
                // firestoreDataObject will remain {}
            }

            const currentCacheString = localStorage.getItem(LOCAL_STORAGE_KEY);
            const newFirestoreDataString = JSON.stringify(firestoreDataObject);

            if (currentCacheString !== newFirestoreDataString) {
                console.log(`Data for ${LOCAL_STORAGE_KEY} has changed or cache was empty/invalid. Rendering from Firestore.`);
                renderOurProgramsMeta(firestoreDataObject);
                localStorage.setItem(LOCAL_STORAGE_KEY, newFirestoreDataString);
                console.log(`Updated ${LOCAL_STORAGE_KEY} in cache.`);
            } else if (!renderedFromCache) {
                console.log(`Cache for ${LOCAL_STORAGE_KEY} was not rendered. Rendering current Firestore data.`);
                renderOurProgramsMeta(firestoreDataObject);
                if(!currentCacheString) localStorage.setItem(LOCAL_STORAGE_KEY, newFirestoreDataString);
            } else {
                console.log(`Data for ${LOCAL_STORAGE_KEY} is unchanged from cache. No UI update needed.`);
            }
        })
        .catch(error => {
            console.error(`Error fetching ${LOCAL_STORAGE_KEY} from Firestore:`, error);
            // If Firestore fails, and we haven't rendered from cache, the static HTML content remains.
            // If we did render from cache, we keep showing cached.
            if (!renderedFromCache) {
                 console.warn(`Failed to fetch ${LOCAL_STORAGE_KEY}, and no cache available. Static content will be displayed.`);
                 // titleElement.textContent = "Our Programs (Error)"; // Optionally indicate error
                 // introElement.textContent = "Could not load details at this time.";
            } else {
                 console.warn(`Failed to update ${LOCAL_STORAGE_KEY} from Firestore. Displaying cached version.`);
            }
        });
});
