document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase is initialized (it should be by firebase-config.js)
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error("Firebase not initialized. Make sure firebase-config.js is loaded before this script.");
        // Optionally display an error message to the user on the page
        const heroTitleElement = document.getElementById('programs-page-hero-title');
        const programGridElement = document.getElementById('program-grid');
        if (heroTitleElement) {
            heroTitleElement.textContent = "Error Loading Content";
        }
        if (programGridElement) {
            programGridElement.innerHTML = '<p class="error-message">Could not load programs. Please check your connection or try again later.</p>';
        }
        return;
    }

    const db = firebase.firestore();

    // Fetch and Display Programs Page Hero Content
    async function displayProgramsPageHero() {
        const heroTitleElement = document.getElementById('programs-page-hero-title');
        const heroParagraphElement = document.getElementById('programs-page-hero-paragraph');

        if (!heroTitleElement || !heroParagraphElement) {
            console.error("Programs page hero elements not found in DOM.");
            return;
        }

        try {
            const programsPageCollection = db.collection('programs_page');
            const doc = await programsPageCollection.doc('main_content').get();

            if (doc.exists) {
                const data = doc.data();
                heroTitleElement.textContent = data.heroTitle || "Our Programs"; // Fallback
                heroParagraphElement.textContent = data.heroParagraph || "Explore our comprehensive range of healthcare education programs"; // Fallback
            } else {
                console.log("Programs page hero document ('main_content') not found.");
                // Keep default static content or set specific fallbacks
                heroTitleElement.textContent = "Our Programs (Default)";
                heroParagraphElement.textContent = "Explore our comprehensive range of healthcare education programs (Default)";
            }
        } catch (error) {
            console.error("Error fetching programs page hero content:", error);
            // Keep default static content or display an error
             heroTitleElement.textContent = "Error Loading Title";
             heroParagraphElement.textContent = "Could not load description. Please try again.";
        }
    }

    // Fetch and Display Program Cards
    async function displayProgramCards() {
        const programGridElement = document.getElementById('program-grid');

        if (!programGridElement) {
            console.error("Program grid element not found in DOM.");
            return;
        }

        programGridElement.innerHTML = '<div class="program-card-placeholder"><p>Loading programs...</p></div>'; // Clear and show loading

        try {
            const programsCollection = db.collection('programs');
            const snapshot = await programsCollection.orderBy('order').get();

            if (snapshot.empty) {
                programGridElement.innerHTML = '<p>No programs available at the moment. Please check back later.</p>';
                return;
            }

            programGridElement.innerHTML = ''; // Clear loading message

            snapshot.forEach(doc => {
                const data = doc.data();

                const cardDiv = document.createElement('div');
                cardDiv.classList.add('program-card');

                const img = document.createElement('img');
                img.src = data.imageUrl || 'frontend/images/placeholder-program.jpg'; // Fallback image
                img.alt = data.title || 'Program image';
                img.loading = 'lazy';

                const contentDiv = document.createElement('div');
                contentDiv.classList.add('program-content');

                const h3 = document.createElement('h3');
                h3.textContent = data.title || 'Untitled Program';

                const p = document.createElement('p');
                p.textContent = data.description || 'No description available.';

                const footerDiv = document.createElement('div');
                footerDiv.classList.add('program-footer');

                const durationSpan = document.createElement('span');
                durationSpan.classList.add('duration');
                durationSpan.innerHTML = `<i class="far fa-clock"></i> ${data.duration || 'N/A'}`;

                const linkA = document.createElement('a');
                linkA.href = data.linkUrl || '#';
                linkA.classList.add('btn');
                linkA.textContent = 'Learn More';

                footerDiv.appendChild(durationSpan);
                footerDiv.appendChild(linkA);

                contentDiv.appendChild(h3);
                contentDiv.appendChild(p);
                contentDiv.appendChild(footerDiv);

                cardDiv.appendChild(img);
                cardDiv.appendChild(contentDiv);

                programGridElement.appendChild(cardDiv);
            });

        } catch (error) {
            console.error("Error fetching program cards:", error);
            programGridElement.innerHTML = '<p class="error-message">Error loading programs. Please try refreshing the page.</p>';
        }
    }

    // Call functions to display content
    displayProgramsPageHero();
    displayProgramCards();
});
