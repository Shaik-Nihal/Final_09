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
            loadAccreditations(); // Load accreditations
        } else {
            // ... (redirect logic)
        }
    });

    // Accreditations Management
    const accreditationsCollection = db.collection('accreditations_homepage');

    const accreditationsForm = document.getElementById('accreditations-form');
    const accreditationsFormTitle = document.getElementById('accreditations-form-title');
    const accreditationDocIdInput = document.getElementById('accreditation-docId');
    const accreditationNameInput = document.getElementById('accreditation-name');
    const accreditationLogoUrlInput = document.getElementById('accreditation-logo-url');
    const accreditationOrderInput = document.getElementById('accreditation-order');
    const accreditationSaveButton = document.getElementById('accreditation-save-button');
    const accreditationCancelEditButton = document.getElementById('accreditation-cancel-edit-button');
    const accreditationsList = document.getElementById('accreditations-list');
    const accreditationsStatusDiv = document.getElementById('accreditations-status');

    // Show message utility for accreditations
    function showAccreditationMessage(message, isSuccess = false) {
        if (!accreditationsStatusDiv) return;
        accreditationsStatusDiv.textContent = message;
        accreditationsStatusDiv.className = isSuccess ? 'success-message' : 'error-message';
        accreditationsStatusDiv.style.display = 'block';
        setTimeout(() => {
            accreditationsStatusDiv.style.display = 'none';
        }, 5000);
    }

    // Reset Accreditation Form
    function resetAccreditationForm() {
        if (accreditationsForm) accreditationsForm.reset();
        if (accreditationDocIdInput) accreditationDocIdInput.value = '';
        if (accreditationsFormTitle) accreditationsFormTitle.textContent = 'Add New Accreditation';
        if (accreditationSaveButton) accreditationSaveButton.textContent = 'Save Accreditation';
        if (accreditationCancelEditButton) accreditationCancelEditButton.style.display = 'none';
        if (accreditationLogoUrlInput) accreditationLogoUrlInput.value = '';
        showAccreditationMessage("", false); // Clear status message
    }

    // Load Accreditations
    async function loadAccreditations() {
        if (!accreditationsList) return;
        accreditationsList.innerHTML = '<li class="list-item-placeholder">Loading accreditations...</li>';

        try {
            const snapshot = await accreditationsCollection.orderBy('order', 'asc').get();
            if (snapshot.empty) {
                accreditationsList.innerHTML = '<li class="list-item-placeholder">No accreditations found. Add one using the form.</li>';
                return;
            }

            accreditationsList.innerHTML = ''; // Clear list
            snapshot.forEach(doc => {
                const item = doc.data();
                const listItem = document.createElement('li');
                listItem.setAttribute('data-id', doc.id);
                listItem.innerHTML = `
                    <div class="accreditation-info">
                        <h5>${item.name} (Order: ${item.order})</h5>
                        <p><a href="${item.logoUrl}" target="_blank">View Logo</a></p>
                        ${item.logoUrl ? `<img src="${item.logoUrl}" alt="${item.name}" style="width: 80px; height: auto; margin-top: 5px; border: 1px solid #eee;">` : ''}
                    </div>
                    <div class="accreditation-actions">
                        <button class="btn btn-sm btn-edit accreditation-edit">Edit</button>
                        <button class="btn btn-sm btn-danger accreditation-delete">Delete</button>
                    </div>
                `;
                accreditationsList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error loading accreditations:", error);
            accreditationsList.innerHTML = '<li class="list-item-placeholder error-message">Error loading accreditations.</li>';
            showAccreditationMessage("Error loading accreditations: " + error.message);
        }
    }

    // Handle Accreditation Form Submission
    if (accreditationsForm) {
        accreditationsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!auth.currentUser) {
                showAccreditationMessage("You must be logged in to manage accreditations.");
                return;
            }

            const docId = accreditationDocIdInput.value;
            const name = accreditationNameInput.value.trim();
            const logoUrl = accreditationLogoUrlInput.value.trim();
            const order = parseInt(accreditationOrderInput.value, 10);

            if (!name || !logoUrl || isNaN(order)) {
                showAccreditationMessage("Please fill in all fields: Name, Logo URL, and Order.");
                return;
            }

            if (accreditationSaveButton) {
                accreditationSaveButton.disabled = true;
                accreditationSaveButton.textContent = docId ? "Updating..." : "Saving...";
            }
            showAccreditationMessage("", false); // Clear previous messages

            const accreditationData = {
                name,
                logoUrl,
                order,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                if (docId) { // Editing existing item
                    await accreditationsCollection.doc(docId).update(accreditationData);
                    showAccreditationMessage("Accreditation updated successfully!", true);
                } else { // Adding new item
                    accreditationData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    await accreditationsCollection.add(accreditationData);
                    showAccreditationMessage("Accreditation added successfully!", true);
                }
                resetAccreditationForm();
                loadAccreditations();
            } catch (error) {
                console.error("Error saving accreditation:", error);
                showAccreditationMessage("Error saving accreditation: " + error.message);
            } finally {
                if (accreditationSaveButton) {
                    accreditationSaveButton.disabled = false;
                    accreditationSaveButton.textContent = docId ? "Update Accreditation" : "Save Accreditation";
                }
                 if (docId) {
                    resetAccreditationForm(); // Reset form to "Add New" mode after successful update
                }
            }
        });
    }

    // Handle Edit/Delete clicks on Accreditations List
    if (accreditationsList) {
        accreditationsList.addEventListener('click', async (e) => {
            const target = e.target;
            const listItem = target.closest('li');
            if (!listItem) return;
            const docId = listItem.getAttribute('data-id');

            if (target.classList.contains('accreditation-edit')) {
                if (!docId) return;
                try {
                    const doc = await accreditationsCollection.doc(docId).get();
                    if (doc.exists) {
                        const item = doc.data();
                        if(accreditationsFormTitle) accreditationsFormTitle.textContent = 'Edit Accreditation';
                        if(accreditationDocIdInput) accreditationDocIdInput.value = doc.id;
                        if(accreditationNameInput) accreditationNameInput.value = item.name || '';
                        if(accreditationLogoUrlInput) accreditationLogoUrlInput.value = item.logoUrl || '';
                        if(accreditationOrderInput) accreditationOrderInput.value = item.order || 1;

                        if(accreditationSaveButton) accreditationSaveButton.textContent = 'Update Accreditation';
                        if(accreditationCancelEditButton) accreditationCancelEditButton.style.display = 'inline-block';
                        if(accreditationsForm) accreditationsForm.scrollIntoView({ behavior: 'smooth' });
                        showAccreditationMessage("");
                    } else {
                         showAccreditationMessage("Accreditation item not found.");
                    }
                } catch (error) {
                    console.error("Error fetching accreditation for edit:", error);
                    showAccreditationMessage("Error fetching item: " + error.message);
                }
            } else if (target.classList.contains('accreditation-delete')) {
                if (!docId) return;
                if (confirm('Are you sure you want to delete this accreditation item?')) {
                    try {
                        await accreditationsCollection.doc(docId).delete();
                        showAccreditationMessage("Accreditation item deleted successfully!", true);
                        loadAccreditations();
                    } catch (error) {
                        console.error("Error deleting accreditation item:", error);
                        showAccreditationMessage("Error deleting item: " + error.message);
                    }
                }
            }
        });
    }

    // Handle Accreditation Cancel Edit Button
    if (accreditationCancelEditButton) {
        accreditationCancelEditButton.addEventListener('click', () => {
            resetAccreditationForm();
        });
    }

    // Global Connections Management
    const gcCollection = db.collection('global_connections_homepage');

    const gcForm = document.getElementById('global-connections-form');
    const gcFormTitle = document.getElementById('gc-form-title');
    const gcDocIdInput = document.getElementById('gc-docId');
    const gcNameInput = document.getElementById('gc-name');
    const gcDescriptionInput = document.getElementById('gc-description');
    const gcImageUrlInput = document.getElementById('gc-image-url');
    const gcOrderInput = document.getElementById('gc-order');
    const gcSaveButton = document.getElementById('gc-save-button');
    const gcCancelEditButton = document.getElementById('gc-cancel-edit-button');
    const gcList = document.getElementById('global-connections-list');
    const gcStatusDiv = document.getElementById('gc-status');

    // Show message utility for Global Connections
    function showGcMessage(message, isSuccess = false) {
        if (!gcStatusDiv) return;
        gcStatusDiv.textContent = message;
        gcStatusDiv.className = isSuccess ? 'success-message' : 'error-message';
        gcStatusDiv.style.display = 'block';
        setTimeout(() => {
            gcStatusDiv.style.display = 'none';
        }, 5000);
    }

    // Reset Global Connection Form
    function resetGcForm() {
        if (gcForm) gcForm.reset();
        if (gcDocIdInput) gcDocIdInput.value = '';
        if (gcFormTitle) gcFormTitle.textContent = 'Add New Global Connection';
        if (gcSaveButton) gcSaveButton.textContent = 'Save Connection';
        if (gcCancelEditButton) gcCancelEditButton.style.display = 'none';
        showGcMessage("", false); // Clear status message
    }

    // Load Global Connections
    async function loadGlobalConnections() {
        if (!gcList) return;
        gcList.innerHTML = '<li class="list-item-placeholder">Loading connections...</li>';

        try {
            const snapshot = await gcCollection.orderBy('order', 'asc').get();
            if (snapshot.empty) {
                gcList.innerHTML = '<li class="list-item-placeholder">No global connections found. Add one using the form.</li>';
                return;
            }

            gcList.innerHTML = ''; // Clear list
            snapshot.forEach(doc => {
                const item = doc.data();
                const listItem = document.createElement('li');
                listItem.setAttribute('data-id', doc.id);
                listItem.innerHTML = `
                    <div class="gc-info">
                        <h5>${item.name} (Order: ${item.order})</h5>
                        <p>${item.description ? item.description.substring(0, 60) + '...' : ''}</p>
                        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 100px; height: auto; margin-top: 5px; border: 1px solid #eee;">` : ''}
                    </div>
                    <div class="gc-actions">
                        <button class="btn btn-sm btn-edit gc-edit">Edit</button>
                        <button class="btn btn-sm btn-danger gc-delete">Delete</button>
                    </div>
                `;
                gcList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error loading global connections:", error);
            gcList.innerHTML = '<li class="list-item-placeholder error-message">Error loading connections.</li>';
            showGcMessage("Error loading connections: " + error.message);
        }
    }

    // Handle Global Connection Form Submission
    if (gcForm) {
        gcForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!auth.currentUser) {
                showGcMessage("You must be logged in to manage global connections.");
                return;
            }

            const docId = gcDocIdInput.value;
            const name = gcNameInput.value.trim();
            const description = gcDescriptionInput.value.trim();
            const imageUrl = gcImageUrlInput.value.trim();
            const order = parseInt(gcOrderInput.value, 10);

            if (!name || !description || !imageUrl || isNaN(order)) {
                showGcMessage("Please fill in all fields: Name, Description, Image URL, and Order.");
                return;
            }

            if (gcSaveButton) {
                gcSaveButton.disabled = true;
                gcSaveButton.textContent = docId ? "Updating..." : "Saving...";
            }
            showGcMessage("", false); // Clear previous messages

            const gcData = {
                name,
                description,
                imageUrl,
                order,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                if (docId) { // Editing existing item
                    await gcCollection.doc(docId).update(gcData);
                    showGcMessage("Global Connection updated successfully!", true);
                } else { // Adding new item
                    gcData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    await gcCollection.add(gcData);
                    showGcMessage("Global Connection added successfully!", true);
                }
                resetGcForm();
                loadGlobalConnections();
            } catch (error) {
                console.error("Error saving global connection:", error);
                showGcMessage("Error saving connection: " + error.message);
            } finally {
                if (gcSaveButton) {
                    gcSaveButton.disabled = false;
                    gcSaveButton.textContent = docId ? "Update Connection" : "Save Connection";
                }
                if (docId) {
                    resetGcForm(); // Reset form to "Add New" mode after successful update
                }
            }
        });
    }

    // Handle Edit/Delete clicks on Global Connections List
    if (gcList) {
        gcList.addEventListener('click', async (e) => {
            const target = e.target;
            const listItem = target.closest('li');
            if (!listItem) return;
            const docId = listItem.getAttribute('data-id');

            if (target.classList.contains('gc-edit')) {
                if (!docId) return;
                try {
                    const doc = await gcCollection.doc(docId).get();
                    if (doc.exists) {
                        const item = doc.data();
                        if(gcFormTitle) gcFormTitle.textContent = 'Edit Global Connection';
                        if(gcDocIdInput) gcDocIdInput.value = doc.id;
                        if(gcNameInput) gcNameInput.value = item.name || '';
                        if(gcDescriptionInput) gcDescriptionInput.value = item.description || '';
                        if(gcImageUrlInput) gcImageUrlInput.value = item.imageUrl || '';
                        if(gcOrderInput) gcOrderInput.value = item.order || 1;

                        if(gcSaveButton) gcSaveButton.textContent = 'Update Connection';
                        if(gcCancelEditButton) gcCancelEditButton.style.display = 'inline-block';
                        if(gcForm) gcForm.scrollIntoView({ behavior: 'smooth' });
                        showGcMessage("");
                    } else {
                         showGcMessage("Global Connection item not found.");
                    }
                } catch (error) {
                    console.error("Error fetching global connection for edit:", error);
                    showGcMessage("Error fetching item: " + error.message);
                }
            } else if (target.classList.contains('gc-delete')) {
                if (!docId) return;
                if (confirm('Are you sure you want to delete this global connection?')) {
                    try {
                        await gcCollection.doc(docId).delete();
                        showGcMessage("Global Connection deleted successfully!", true);
                        loadGlobalConnections(); // Refresh the list
                    } catch (error) {
                        console.error("Error deleting global connection:", error);
                        showGcMessage("Error deleting connection: " + error.message);
                    }
                }
            }
        });
    }

    // Handle Global Connection Cancel Edit Button
    if (gcCancelEditButton) {
        gcCancelEditButton.addEventListener('click', () => {
            resetGcForm();
        });
    }

    // Initial Load for authenticated users - extended
    auth.onAuthStateChanged((user) => {
        if (user) {
            // ... (other loads like loadHeroSlides, loadProgramsHeroContent)
            loadProgramCards(); // Load program cards data
            loadAccreditations(); // Load accreditations
            loadGlobalConnections(); // Load global connections
            loadCentersList(); // Load centers list
        } else {
            // ... (redirect logic)
        }
    });

    // Centers List Management
    const centersCollection = db.collection('centers_list');

    const centersForm = document.getElementById('centers-form');
    const centerFormTitle = document.getElementById('center-form-title');
    const centerDocIdInput = document.getElementById('center-docId');
    const centerNameInput = document.getElementById('center-name');
    const centerImageUrlInput = document.getElementById('center-image-url');
    const centerDescriptionInput = document.getElementById('center-description');
    const centerPageUrlInput = document.getElementById('center-page-url');
    const centerOrderInput = document.getElementById('center-order');
    const centerSaveButton = document.getElementById('center-save-button');
    const centerCancelEditButton = document.getElementById('center-cancel-edit-button');
    const centersList = document.getElementById('centers-list');
    const centersStatusDiv = document.getElementById('centers-status');

    // Show message utility for Centers
    function showCenterMessage(message, isSuccess = false) {
        if (!centersStatusDiv) return;
        centersStatusDiv.textContent = message;
        centersStatusDiv.className = isSuccess ? 'success-message' : 'error-message';
        centersStatusDiv.style.display = 'block';
        setTimeout(() => {
            centersStatusDiv.style.display = 'none';
        }, 5000);
    }

    // Reset Center Form
    function resetCenterForm() {
        if (centersForm) centersForm.reset();
        if (centerDocIdInput) centerDocIdInput.value = '';
        if (centerFormTitle) centerFormTitle.textContent = 'Add New Center';
        if (centerSaveButton) centerSaveButton.textContent = 'Save Center';
        if (centerCancelEditButton) centerCancelEditButton.style.display = 'none';
        showCenterMessage("", false);
    }

    // Load Centers List
    async function loadCentersList() {
        if (!centersList) return;
        centersList.innerHTML = '<li class="list-item-placeholder">Loading centers...</li>';

        try {
            const snapshot = await centersCollection.orderBy('order', 'asc').get();
            if (snapshot.empty) {
                centersList.innerHTML = '<li class="list-item-placeholder">No centers found. Add one using the form.</li>';
                return;
            }

            centersList.innerHTML = ''; // Clear list
            snapshot.forEach(doc => {
                const item = doc.data();
                const listItem = document.createElement('li');
                listItem.setAttribute('data-id', doc.id);
                listItem.innerHTML = `
                    <div class="center-info">
                        <h5>${item.name} (Order: ${item.order})</h5>
                        <p>${item.description ? item.description.substring(0, 60) + '...' : ''}</p>
                        <p><small>Page URL: ${item.pageUrl}</small></p>
                        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 100px; height: auto; margin-top: 5px; border: 1px solid #eee;">` : ''}
                    </div>
                    <div class="center-actions">
                        <button class="btn btn-sm btn-edit center-edit">Edit</button>
                        <button class="btn btn-sm btn-danger center-delete">Delete</button>
                    </div>
                `;
                centersList.appendChild(listItem);
            });
        } catch (error) {
            console.error("Error loading centers:", error);
            centersList.innerHTML = '<li class="list-item-placeholder error-message">Error loading centers.</li>';
            showCenterMessage("Error loading centers: " + error.message);
        }
    }

    // Handle Center Form Submission
    if (centersForm) {
        centersForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!auth.currentUser) {
                showCenterMessage("You must be logged in to manage centers.");
                return;
            }

            const docId = centerDocIdInput.value;
            const name = centerNameInput.value.trim();
            const imageUrl = centerImageUrlInput.value.trim();
            const description = centerDescriptionInput.value.trim();
            const pageUrl = centerPageUrlInput.value.trim();
            const order = parseInt(centerOrderInput.value, 10);

            if (!name || !imageUrl || !description || !pageUrl || isNaN(order)) {
                showCenterMessage("Please fill in all fields: Name, Image URL, Description, Page URL, and Order.");
                return;
            }

            if (centerSaveButton) {
                centerSaveButton.disabled = true;
                centerSaveButton.textContent = docId ? "Updating..." : "Saving...";
            }
            showCenterMessage("", false);

            const centerData = {
                name,
                imageUrl,
                description,
                pageUrl,
                order,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                if (docId) { // Editing existing item
                    await centersCollection.doc(docId).update(centerData);
                    showCenterMessage("Center updated successfully!", true);
                } else { // Adding new item
                    centerData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    await centersCollection.add(centerData);
                    showCenterMessage("Center added successfully!", true);
                }
                resetCenterForm();
                loadCentersList();
            } catch (error) {
                console.error("Error saving center:", error);
                showCenterMessage("Error saving center: " + error.message);
            } finally {
                if (centerSaveButton) {
                    centerSaveButton.disabled = false;
                    centerSaveButton.textContent = docId ? "Update Center" : "Save Center";
                }
                if (docId) {
                    resetCenterForm();
                }
            }
        });
    }

    // Handle Edit/Delete clicks on Centers List
    if (centersList) {
        centersList.addEventListener('click', async (e) => {
            const target = e.target;
            const listItem = target.closest('li');
            if (!listItem) return;
            const docId = listItem.getAttribute('data-id');

            if (target.classList.contains('center-edit')) {
                if (!docId) return;
                try {
                    const doc = await centersCollection.doc(docId).get();
                    if (doc.exists) {
                        const item = doc.data();
                        if(centerFormTitle) centerFormTitle.textContent = 'Edit Center';
                        if(centerDocIdInput) centerDocIdInput.value = doc.id;
                        if(centerNameInput) centerNameInput.value = item.name || '';
                        if(centerImageUrlInput) centerImageUrlInput.value = item.imageUrl || '';
                        if(centerDescriptionInput) centerDescriptionInput.value = item.description || '';
                        if(centerPageUrlInput) centerPageUrlInput.value = item.pageUrl || '';
                        if(centerOrderInput) centerOrderInput.value = item.order || 1;

                        if(centerSaveButton) centerSaveButton.textContent = 'Update Center';
                        if(centerCancelEditButton) centerCancelEditButton.style.display = 'inline-block';
                        if(centersForm) centersForm.scrollIntoView({ behavior: 'smooth' });
                        showCenterMessage("");
                    } else {
                         showCenterMessage("Center item not found.");
                    }
                } catch (error) {
                    console.error("Error fetching center for edit:", error);
                    showCenterMessage("Error fetching center: " + error.message);
                }
            } else if (target.classList.contains('center-delete')) {
                if (!docId) return;
                if (confirm('Are you sure you want to delete this center?')) {
                    try {
                        await centersCollection.doc(docId).delete();
                        showCenterMessage("Center deleted successfully!", true);
                        loadCentersList();
                    } catch (error) {
                        console.error("Error deleting center:", error);
                        showCenterMessage("Error deleting center: " + error.message);
                    }
                }
            }
        });
    }

    // Handle Center Cancel Edit Button
    if (centerCancelEditButton) {
        centerCancelEditButton.addEventListener('click', () => {
            resetCenterForm();
        });
    }
});
