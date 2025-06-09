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

    if (!logosContainer) {
        console.error("Error: The container '#dynamic-accreditation-logos' was not found in the HTML.");
        return;
    }

    accreditationsCollection.orderBy('order', 'asc').get()
        .then(snapshot => {
            if (snapshot.empty) {
                logosContainer.innerHTML = '<p style="text-align:center;">No accreditations or affiliations to display at the moment.</p>';
                return;
            }

            let htmlContent = '';
            snapshot.forEach(doc => {
                const item = doc.data();
                // Basic validation for essential fields
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

            if (htmlContent === '') { // Handles case where items exist but all are invalid
                 logosContainer.innerHTML = '<p style="text-align:center;">No valid accreditations to display.</p>';
            } else {
                logosContainer.innerHTML = htmlContent;
            }

        })
        .catch(error => {
            console.error("Error fetching accreditations:", error);
            logosContainer.innerHTML = '<p style="color:red; text-align:center;">Could not load accreditations due to an error. Please try again later.</p>';
        });
});
