document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error("Firebase not initialized. Ensure firebase-config.js is loaded before homepage-programs-loader.js.");
        const programsContainer = document.getElementById('dynamic-program-cards-homepage');
        if (programsContainer) {
            programsContainer.innerHTML = '<p style="color:red; text-align:center;">Error: Firebase not configured. Programs cannot be loaded.</p>';
        }
        return;
    }

    const db = firebase.firestore();
    const programsCollectionRef = db.collection('programs'); // Using existing 'programs' collection
    const programsContainer = document.getElementById('dynamic-program-cards-homepage');
    const LOCAL_STORAGE_KEY = 'homepageProgramsCache';

    if (!programsContainer) {
        console.error("Error: The container '#dynamic-program-cards-homepage' was not found in the HTML.");
        return;
    }

    function renderHomepagePrograms(data, container) {
        container.innerHTML = ''; // Clear previous content

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center;">Program details are coming soon. Please check back later!</p>';
            return;
        }

        let htmlContent = '';
        data.forEach(program => {
            if (program.title && program.description && program.imageUrl && program.linkUrl) {
                htmlContent += `
                    <div class="program-card">
                        <img src="${program.imageUrl}" alt="${program.title}" loading="lazy">
                        <h3>${program.title}</h3>
                        <p>${program.description}</p>
                        <a href="${program.linkUrl.startsWith('/') ? '' : '/'}${program.linkUrl}" class="btn">Learn More</a>
                    </div>
                `;
            } else {
                console.warn("Skipping a homepage program card item due to missing essential fields:", program);
            }
        });

        if (htmlContent === '') {
            container.innerHTML = '<p style="text-align:center;">Currently, no program information is available in the required format.</p>';
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
                renderHomepagePrograms(cachedData, programsContainer);
                renderedFromCache = true;
                console.log(`Loaded ${LOCAL_STORAGE_KEY} from cache.`);
            }
        }
    } catch (e) {
        console.error(`Error reading or parsing ${LOCAL_STORAGE_KEY} from cache:`, e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }

    if (!renderedFromCache) {
        // programsContainer.innerHTML = '<p style="text-align:center;">Loading programs...</p>';
    }

    programsCollectionRef.orderBy('order', 'asc').get()
        .then(snapshot => {
            const firestoreDataArray = [];
            snapshot.forEach(doc => {
                firestoreDataArray.push(doc.data());
            });

            const currentCacheString = localStorage.getItem(LOCAL_STORAGE_KEY);
            const newFirestoreDataString = JSON.stringify(firestoreDataArray);

            if (currentCacheString !== newFirestoreDataString) {
                console.log(`Data for ${LOCAL_STORAGE_KEY} has changed or cache was empty/invalid. Rendering from Firestore.`);
                renderHomepagePrograms(firestoreDataArray, programsContainer);
                localStorage.setItem(LOCAL_STORAGE_KEY, newFirestoreDataString);
                console.log(`Updated ${LOCAL_STORAGE_KEY} in cache.`);
            } else if (!renderedFromCache) {
                console.log(`Cache for ${LOCAL_STORAGE_KEY} was not rendered. Rendering current Firestore data.`);
                renderHomepagePrograms(firestoreDataArray, programsContainer);
                if(!currentCacheString) localStorage.setItem(LOCAL_STORAGE_KEY, newFirestoreDataString);
            } else {
                console.log(`Data for ${LOCAL_STORAGE_KEY} is unchanged from cache. No UI update needed.`);
            }
        })
        .catch(error => {
            console.error(`Error fetching ${LOCAL_STORAGE_KEY} from Firestore:`, error);
            if (!renderedFromCache) {
                programsContainer.innerHTML = '<p style="color:red; text-align:center;">Could not load programs due to an error. Please try again later.</p>';
            } else {
                console.warn(`Failed to update ${LOCAL_STORAGE_KEY} from Firestore. Displaying cached version.`);
            }
        });
});
