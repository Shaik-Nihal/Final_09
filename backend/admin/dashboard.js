document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase is initialized
    if (typeof firebase === 'undefined' || typeof firebase.auth === 'undefined') {
        console.error("Firebase not initialized. Make sure firebase-config.js is loaded before this script.");
        alert("Firebase not initialized. Admin panel cannot function.");
        // Potentially redirect to login or show a more permanent error
        if (window.location.pathname !== '/admin/index.html' && window.location.pathname !== '/admin/') {
             window.location.href = 'index.html'; // Redirect to login if not already there
        }
        return;
    }

    const auth = firebase.auth();
    const logoutButton = document.getElementById('logout-button');

    // Auth State Listener for Dashboard
    // Redirect to login if user is not logged in and not on the login page
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in.
            console.log("Dashboard: User is logged in", user.email);
            // You can fetch user-specific data here if needed for the dashboard
        } else {
            // User is signed out.
            console.log("Dashboard: User is not logged in. Redirecting to login page.");
            // Ensure we are not already on a page that doesn't require auth or is the login page itself
            // to prevent redirect loops if auth.js also has a similar check.
            // For dashboard.js, it's simpler: if no user, go to index.html (login).
            if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/admin/') && !window.location.pathname.endsWith('/admin')) {
                 window.location.href = 'index.html';
            }
        }
    });

    // Handle Logout Button Click
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            auth.signOut()
                .then(() => {
                    // Sign-out successful.
                    console.log("User signed out successfully.");
                    window.location.href = 'index.html'; // Redirect to login page
                })
                .catch((error) => {
                    // An error happened.
                    console.error("Sign out error:", error);
                    alert("Error signing out: " + error.message);
                });
        });
    } else {
        console.warn("Logout button not found on this page.");
    }

    const db = firebase.firestore();
    const storage = firebase.storage();
    const heroCollection = db.collection('hero_section');

    // Hero Section Management Elements
    const heroForm = document.getElementById('hero-form');
    const heroFormTitle = document.getElementById('hero-form-title');
    const heroSlideIdInput = document.getElementById('hero-slideId');
    const heroImageUrlInput = document.getElementById('hero-image-url'); // Changed from hero-image-upload
    const heroHeadingInput = document.getElementById('hero-heading');
    const heroParagraphInput = document.getElementById('hero-paragraph');
    const heroButtonTextInput = document.getElementById('hero-button-text');
    const heroButtonUrlInput = document.getElementById('hero-button-url');
    const heroOrderInput = document.getElementById('hero-order');
    const heroSaveButton = document.getElementById('hero-save-button');
    const heroCancelEditButton = document.getElementById('hero-cancel-edit-button');
    const heroSlidesList = document.getElementById('hero-slides-list');
    // const heroCurrentImagePreview = document.getElementById('hero-current-image'); // Removed
    const heroFormError = document.getElementById('hero-form-error');
    const heroFormSuccess = document.getElementById('hero-form-success');


    // Function to display messages
    function showMessage(element, message, isSuccess = false) {
        if (!element) return;
        element.textContent = message;
        element.style.display = 'block';
        element.className = isSuccess ? 'success-message' : 'error-message';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    // Reset Hero Form
    function resetHeroForm() {
        if (heroForm) heroForm.reset();
        if (heroSlideIdInput) heroSlideIdInput.value = '';
        if (heroFormTitle) heroFormTitle.textContent = 'Add New Hero Slide';
        if (heroSaveButton) heroSaveButton.textContent = 'Save Slide';
        if (heroCancelEditButton) heroCancelEditButton.style.display = 'none';
        // if (heroCurrentImagePreview) { // Removed
        //     heroCurrentImagePreview.style.display = 'none';
        //     heroCurrentImagePreview.src = '#';
        // }
        if(heroImageUrlInput) heroImageUrlInput.value = ''; // Clear text input
    }

    // Load Hero Slides
    async function loadHeroSlides() {
        if (!heroSlidesList) return;
        heroSlidesList.innerHTML = '<li class="list-item-placeholder">Loading slides...</li>'; // Placeholder while loading

        try {
            const snapshot = await heroCollection.orderBy('order', 'asc').get();
            if (snapshot.empty) {
                heroSlidesList.innerHTML = '<li class="list-item-placeholder">No slides found. Add one using the form.</li>';
                return;
            }

            heroSlidesList.innerHTML = ''; // Clear list
            snapshot.forEach(doc => {
                const slide = doc.data();
                const listItem = document.createElement('li');
                listItem.setAttribute('data-id', doc.id);
                listItem.innerHTML = `
                    <div class="slide-info">
                        <h4>${slide.heading} (Order: ${slide.order})</h4>
                        <p>${slide.paragraph.substring(0, 50)}...</p>
                        ${slide.imageUrl ? `<img src="${slide.imageUrl}" alt="${slide.heading}" style="width: 100px; height: auto; margin-top: 5px;">` : ''}
                    </div>
                    <div class="slide-actions">
                        <button class="btn btn-sm btn-edit">Edit</button>
                        <button class="btn btn-sm btn-danger btn-delete">Delete</button>
                    </div>
                `;
                heroSlidesList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error loading hero slides:", error);
            heroSlidesList.innerHTML = '<li class="list-item-placeholder error-message">Error loading slides. Check console.</li>';
            showMessage(heroFormError, "Error loading slides: " + error.message);
        }
    }

    // Handle Hero Form Submission
    if (heroForm) {
        heroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!auth.currentUser) {
                showMessage(heroFormError, "You must be logged in to save slides.");
                return;
            }

            const slideId = heroSlideIdInput.value;
            const heading = heroHeadingInput.value;
            const paragraph = heroParagraphInput.value;
            const buttonText = heroButtonTextInput.value;
            const buttonUrl = heroButtonUrlInput.value;
            const order = parseInt(heroOrderInput.value, 10);
            const imageUrl = heroImageUrlInput.value.trim(); // Read from text input

            if (!heading || !paragraph || !buttonText || !buttonUrl || isNaN(order)) {
                showMessage(heroFormError, "Please fill in all required fields (including Image URL if applicable) and ensure order is a number.");
                return;
            }
            
            heroSaveButton.disabled = true;
            heroSaveButton.textContent = slideId ? "Updating..." : "Saving...";
            showMessage(heroFormSuccess, ""); // Clear previous success
            showMessage(heroFormError, ""); // Clear previous error


            // let imageUrl = heroCurrentImagePreview.src !== '#' ? heroCurrentImagePreview.src : ''; // Removed preview logic

            try {
                // No image upload to Firebase Storage anymore
                // if (imageFile) { ... } block removed

                const slideData = {
                    heading,
                    paragraph,
                    buttonText,
                    buttonUrl,
                    order,
                    imageUrl: imageUrl, // Directly use the URL from the text input
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                if (slideId) { // Editing existing slide
                    await heroCollection.doc(slideId).update(slideData);
                    showMessage(heroFormSuccess, "Slide updated successfully!", true);
                } else { // Adding new slide
                    slideData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    await heroCollection.add(slideData);
                     showMessage(heroFormSuccess, "Slide added successfully!", true);
                }

                resetHeroForm();
                loadHeroSlides();

            } catch (error) {
                console.error("Error saving hero slide:", error);
                showMessage(heroFormError, "Error saving slide: " + error.message);
            } finally {
                heroSaveButton.disabled = false;
                heroSaveButton.textContent = slideId ? "Update Slide" : "Save Slide";
                 if (slideId) { // If it was an edit, reset form to "Add New" mode
                    resetHeroForm();
                }
            }
        });
    }

    // Handle Edit/Delete clicks on Hero Slides List
    if (heroSlidesList) {
        heroSlidesList.addEventListener('click', async (e) => {
            const target = e.target;
            const listItem = target.closest('li');
            if (!listItem) return;
            const slideId = listItem.getAttribute('data-id');

            if (target.classList.contains('btn-edit')) {
                if (!slideId) return;
                try {
                    const doc = await heroCollection.doc(slideId).get();
                    if (doc.exists) {
                        const slide = doc.data();
                        heroFormTitle.textContent = 'Edit Hero Slide';
                        heroSlideIdInput.value = doc.id;
                        heroHeadingInput.value = slide.heading || '';
                        heroParagraphInput.value = slide.paragraph || '';
                        heroButtonTextInput.value = slide.buttonText || '';
                        heroButtonUrlInput.value = slide.buttonUrl || '';
                        heroOrderInput.value = slide.order || 1;
                        heroImageUrlInput.value = slide.imageUrl || ''; // Populate the text input
                        // if (slide.imageUrl) { // Preview logic removed
                        //     heroCurrentImagePreview.src = slide.imageUrl;
                        //     heroCurrentImagePreview.style.display = 'block';
                        // } else {
                        //     heroCurrentImagePreview.src = '#';
                        //     heroCurrentImagePreview.style.display = 'none';
                        // }
                        heroSaveButton.textContent = 'Update Slide';
                        heroCancelEditButton.style.display = 'inline-block';
                        heroForm.scrollIntoView({ behavior: 'smooth' });
                        showMessage(heroFormError, ""); // Clear error if any
                        showMessage(heroFormSuccess, ""); // Clear success if any
                    } else {
                        showMessage(heroFormError, "Slide not found.");
                    }
                } catch (error) {
                    console.error("Error fetching slide for edit:", error);
                    showMessage(heroFormError, "Error fetching slide: " + error.message);
                }
            } else if (target.classList.contains('btn-delete')) {
                if (!slideId) return;
                if (confirm('Are you sure you want to delete this slide?')) {
                    try {
                        const docRef = heroCollection.doc(slideId);
                        // const docSnap = await docRef.get(); // Not needed if not deleting from storage
                        // const slideData = docSnap.data(); // Not needed

                        await docRef.delete();
                        showMessage(heroFormSuccess, "Slide deleted successfully!", true);
                        
                        // Remove image deletion from storage
                        // if (slideData && slideData.imageUrl) { ... } block removed

                        loadHeroSlides();
                    } catch (error) {
                        console.error("Error deleting hero slide:", error);
                        showMessage(heroFormError, "Error deleting slide: " + error.message);
                    }
                }
            }
        });
    }

    // Handle Cancel Edit Button
    if (heroCancelEditButton) {
        heroCancelEditButton.addEventListener('click', () => {
            resetHeroForm();
            showMessage(heroFormError, ""); 
            showMessage(heroFormSuccess, "");
        });
    }
    
    // Preview image before upload - REMOVED
    // if (heroImageUploadInput && heroCurrentImagePreview) { ... }


    // Initial Load for authenticated users
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log("Dashboard: User is logged in", user.email);
            loadHeroSlides(); // Load hero slides data
            loadProgramsHeroContent(); // Load programs page hero content
            // loadProgramCards(); // Placeholder for next feature
        } else {
            console.log("Dashboard: User is not logged in. Redirecting to login page.");
            if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/admin/') && !window.location.pathname.endsWith('/admin')) {
                 window.location.href = 'index.html';
            }
        }
    });

    // Programs Page Hero Management
    const programsPageCollection = db.collection('programs_page');
    const programsHeroDocId = 'main_content'; // Document ID for programs page hero content

    const programsHeroForm = document.getElementById('programs-hero-form');
    const programsHeroTitleInput = document.getElementById('programs-hero-title');
    const programsHeroParagraphInput = document.getElementById('programs-hero-paragraph');
    const programsHeroStatusDiv = document.getElementById('programs-hero-status');
    const saveProgramsHeroButton = document.getElementById('save-programs-hero-button');

    // Load Programs Page Hero Content
    async function loadProgramsHeroContent() {
        if (!programsHeroTitleInput || !programsHeroParagraphInput) return;
        try {
            const doc = await programsPageCollection.doc(programsHeroDocId).get();
            if (doc.exists) {
                const data = doc.data();
                programsHeroTitleInput.value = data.heroTitle || '';
                programsHeroParagraphInput.value = data.heroParagraph || '';
                showMessage(programsHeroStatusDiv, "Content loaded.", true);
            } else {
                showMessage(programsHeroStatusDiv, "No existing content found. Add new content.", false);
                programsHeroTitleInput.value = '';
                programsHeroParagraphInput.value = '';
            }
        } catch (error) {
            console.error("Error loading programs page hero content:", error);
            showMessage(programsHeroStatusDiv, "Error loading content: " + error.message, false);
        }
    }

    // Handle Programs Page Hero Form Submission
    if (programsHeroForm) {
        programsHeroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!auth.currentUser) {
                showMessage(programsHeroStatusDiv, "You must be logged in to save.", false);
                return;
            }

            const title = programsHeroTitleInput.value.trim();
            const paragraph = programsHeroParagraphInput.value.trim();

            if (!title || !paragraph) {
                showMessage(programsHeroStatusDiv, "Please fill in both title and paragraph.", false);
                return;
            }
            
            if(saveProgramsHeroButton) saveProgramsHeroButton.disabled = true;

            const data = {
                heroTitle: title,
                heroParagraph: paragraph,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                await programsPageCollection.doc(programsHeroDocId).set(data, { merge: true });
                showMessage(programsHeroStatusDiv, "Programs hero content saved successfully!", true);
            } catch (error) {
                console.error("Error saving programs hero content:", error);
                showMessage(programsHeroStatusDiv, "Error saving content: " + error.message, false);
            } finally {
                if(saveProgramsHeroButton) saveProgramsHeroButton.disabled = false;
            }
        });
    }

    // Program Cards Management
    const programsCollection = db.collection('programs');

    const programCardForm = document.getElementById('program-card-form');
    const programCardFormTitle = document.getElementById('program-card-form-title');
    const programCardIdInput = document.getElementById('program-cardId');
    const programTitleInput = document.getElementById('program-title');
    const programDescriptionInput = document.getElementById('program-description');
    const programDurationInput = document.getElementById('program-duration');
    const programLinkUrlInput = document.getElementById('program-link-url');
    const programOrderInput = document.getElementById('program-order');
    const programImageUrlInput = document.getElementById('program-image-url'); // Changed from program-image-upload
    // const programImagePreview = document.getElementById('program-image-preview'); // Removed
    const programCardSaveButton = document.getElementById('program-card-save-button');
    const programCardCancelEditButton = document.getElementById('program-card-cancel-edit-button');
    const programCardsList = document.getElementById('program-cards-list');
    const programCardFormError = document.getElementById('program-card-form-error');
    const programCardFormSuccess = document.getElementById('program-card-form-success');

    // Reset Program Card Form
    function resetProgramCardForm() {
        if (programCardForm) programCardForm.reset();
        if (programCardIdInput) programCardIdInput.value = '';
        if (programCardFormTitle) programCardFormTitle.textContent = 'Add New Program Card';
        if (programCardSaveButton) programCardSaveButton.textContent = 'Save Program Card';
        if (programCardCancelEditButton) programCardCancelEditButton.style.display = 'none';
        // if (programImagePreview) { // Removed
        //     programImagePreview.style.display = 'none';
        //     programImagePreview.src = '#';
        // }
        if (programImageUrlInput) programImageUrlInput.value = ''; // Clear text input
        showMessage(programCardFormError, '', false); // Clear any existing error
        showMessage(programCardFormSuccess, '', true); // Clear any existing success
    }

    // Load Program Cards
    async function loadProgramCards() {
        if (!programCardsList) return;
        programCardsList.innerHTML = '<li class="list-item-placeholder">Loading program cards...</li>';

        try {
            const snapshot = await programsCollection.orderBy('order', 'asc').get();
            if (snapshot.empty) {
                programCardsList.innerHTML = '<li class="list-item-placeholder">No program cards found. Add one using the form.</li>';
                return;
            }

            programCardsList.innerHTML = ''; // Clear list
            snapshot.forEach(doc => {
                const card = doc.data();
                const listItem = document.createElement('li');
                listItem.setAttribute('data-id', doc.id);
                listItem.innerHTML = `
                    <div class="card-info">
                        <h4>${card.title} (Order: ${card.order})</h4>
                        <p>${card.description.substring(0, 60)}...</p>
                        ${card.imageUrl ? `<img src="${card.imageUrl}" alt="${card.title}" style="width: 100px; height: auto; margin-top: 5px;">` : ''}
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-edit program-card-edit">Edit</button>
                        <button class="btn btn-sm btn-danger program-card-delete">Delete</button>
                    </div>
                `;
                programCardsList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error loading program cards:", error);
            programCardsList.innerHTML = '<li class="list-item-placeholder error-message">Error loading program cards.</li>';
            showMessage(programCardFormError, "Error loading cards: " + error.message);
        }
    }
    
    // Preview image for Program Card - REMOVED
    // if (programImageUploadInput && programImagePreview) { ... }


    // Handle Program Card Form Submission
    if (programCardForm) {
        programCardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!auth.currentUser) {
                showMessage(programCardFormError, "You must be logged in to save program cards.");
                return;
            }

            const cardId = programCardIdInput.value;
            const title = programTitleInput.value.trim();
            const description = programDescriptionInput.value.trim();
            const duration = programDurationInput.value.trim();
            const linkUrl = programLinkUrlInput.value.trim();
            const order = parseInt(programOrderInput.value, 10);
            const imageUrlFromInput = programImageUrlInput.value.trim(); // Read from text input

            if (!title || !description || !duration || !linkUrl || isNaN(order)) {
                showMessage(programCardFormError, "Please fill in all required fields (including Image URL if applicable) and ensure order is a number.");
                return;
            }

            if(programCardSaveButton) programCardSaveButton.disabled = true;
            if(programCardSaveButton) programCardSaveButton.textContent = cardId ? "Updating..." : "Saving...";
            showMessage(programCardFormSuccess, ""); // Clear previous success
            showMessage(programCardFormError, "");   // Clear previous error

            // let imageUrl = programImagePreview.src.startsWith('http') ? programImagePreview.src : ''; // Removed preview logic
            const imageUrl = imageUrlFromInput; // Use the URL from the text input

            try {
                // No image upload to Firebase Storage anymore
                // if (imageFile) { ... } block removed

                const cardData = {
                    title,
                    description,
                    duration,
                    linkUrl,
                    order,
                    imageUrl: imageUrl, // Directly use the URL from the text input
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                if (cardId) { // Editing existing card
                    await programsCollection.doc(cardId).update(cardData);
                    showMessage(programCardFormSuccess, "Program card updated successfully!", true);
                } else { // Adding new card
                    cardData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    await programsCollection.add(cardData);
                    showMessage(programCardFormSuccess, "Program card added successfully!", true);
                }

                resetProgramCardForm();
                loadProgramCards();

            } catch (error) {
                console.error("Error saving program card:", error);
                showMessage(programCardFormError, "Error saving card: " + error.message);
            } finally {
                if(programCardSaveButton) programCardSaveButton.disabled = false;
                if(programCardSaveButton) programCardSaveButton.textContent = cardId ? "Update Program Card" : "Save Program Card";
                 if (cardId) { // If it was an edit, reset form to "Add New" mode
                    resetProgramCardForm();
                }
            }
        });
    }

    // Handle Edit/Delete clicks on Program Cards List
    if (programCardsList) {
        programCardsList.addEventListener('click', async (e) => {
            const target = e.target;
            const listItem = target.closest('li');
            if (!listItem) return;
            const cardId = listItem.getAttribute('data-id');

            // Edit button
            if (target.classList.contains('program-card-edit')) {
                if (!cardId) return;
                try {
                    const doc = await programsCollection.doc(cardId).get();
                    if (doc.exists) {
                        const card = doc.data();
                        if(programCardFormTitle) programCardFormTitle.textContent = 'Edit Program Card';
                        if(programCardIdInput) programCardIdInput.value = doc.id;
                        if(programTitleInput) programTitleInput.value = card.title || '';
                        if(programDescriptionInput) programDescriptionInput.value = card.description || '';
                        if(programDurationInput) programDurationInput.value = card.duration || '';
                        if(programLinkUrlInput) programLinkUrlInput.value = card.linkUrl || '';
                        if(programOrderInput) programOrderInput.value = card.order || 1;
                        if(programImageUrlInput) programImageUrlInput.value = card.imageUrl || ''; // Populate text input

                        // if (card.imageUrl) { // Preview logic removed
                        //     if(programImagePreview) {
                        //         programImagePreview.src = card.imageUrl;
                        //         programImagePreview.style.display = 'block';
                        //     }
                        // } else {
                        //    if(programImagePreview) {
                        //         programImagePreview.src = '#';
                        //         programImagePreview.style.display = 'none';
                        //    }
                        // }
                        if(programCardSaveButton) programCardSaveButton.textContent = 'Update Program Card';
                        if(programCardCancelEditButton) programCardCancelEditButton.style.display = 'inline-block';
                        if(programCardForm) programCardForm.scrollIntoView({ behavior: 'smooth' });
                        showMessage(programCardFormError, ""); 
                        showMessage(programCardFormSuccess, "");
                    } else {
                         showMessage(programCardFormError, "Program card not found.");
                    }
                } catch (error) {
                    console.error("Error fetching program card for edit:", error);
                    showMessage(programCardFormError, "Error fetching card: " + error.message);
                }
            } 
            // Delete button
            else if (target.classList.contains('program-card-delete')) {
                if (!cardId) return;
                if (confirm('Are you sure you want to delete this program card?')) {
                    try {
                        const docRef = programsCollection.doc(cardId);
                        // const docSnap = await docRef.get(); // Not needed
                        // const cardData = docSnap.data(); // Not needed

                        await docRef.delete();
                        showMessage(programCardFormSuccess, "Program card deleted successfully!", true);
                        
                        // Remove image deletion from storage
                        // if (cardData && cardData.imageUrl) { ... } block removed
                        
                        loadProgramCards();
                    } catch (error) {
                        console.error("Error deleting program card:", error);
                        showMessage(programCardFormError, "Error deleting card: " + error.message);
                    }
                }
            }
        });
    }
    
    // Handle Program Card Cancel Edit Button
    if (programCardCancelEditButton) {
        programCardCancelEditButton.addEventListener('click', () => {
            resetProgramCardForm();
        });
    }

     // Initial Load for authenticated users - extended
    auth.onAuthStateChanged((user) => {
        if (user) {
            // ... (other loads like loadHeroSlides, loadProgramsHeroContent)
            loadProgramCards(); // Load program cards data
        } else {
            // ... (redirect logic)
        }
    });

});
