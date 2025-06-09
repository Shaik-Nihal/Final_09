document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase is initialized
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error("Firebase not initialized. Make sure firebase-config.js is loaded before this script.");
        const heroSliderContainer = document.getElementById('hero-slider');
        if (heroSliderContainer) {
            heroSliderContainer.innerHTML = `
                <div class="slide active">
                    <img src="https://placehold.co/1200x500/ff0000/ffffff?text=Configuration+Error" alt="Error loading content" loading="lazy">
                    <div class="slide-content">
                        <h1>Configuration Error</h1>
                        <p>Could not initialize services. Please contact support or try again later.</p>
                    </div>
                </div>`;
        }
        const sliderControls = document.querySelector('.slider-controls');
        if (sliderControls) sliderControls.style.display = 'none';
        return;
    }

    const db = firebase.firestore();
    const heroCollection = db.collection('hero_section'); // Ensure this matches your Firestore collection name

    const heroSliderContainer = document.getElementById('hero-slider');
    const sliderDotsContainer = document.getElementById('slider-dots');

    const LOCAL_STORAGE_KEY_SLIDES = 'heroSlidesDataCache';

    /**
     * Renders slides into the DOM from the provided slidesData.
     * @param {Array<Object>} slidesData - Array of slide data objects.
     * @param {HTMLElement} sliderContainer - The container for slides.
     * @param {HTMLElement} dotsContainer - The container for navigation dots.
     * @returns {boolean} True if slides were rendered, false if data was empty (placeholder shown).
     */
    function renderSlidesUI(slidesData, sliderContainer, dotsContainer) {
        if (!sliderContainer || !dotsContainer) {
            console.error("Hero slider or dots container not found in the DOM for rendering.");
            return false;
        }

        const controls = document.querySelector('.slider-controls');

        sliderContainer.innerHTML = ''; // Clear existing content
        dotsContainer.innerHTML = '';   // Clear existing dots

        if (!slidesData || slidesData.length === 0) {
            console.log("No slides data to render, showing 'empty' placeholder.");
            sliderContainer.innerHTML = `
                <div class="slide active">
                    <img src="https://placehold.co/1200x500/dddddd/333333?text=No+Content+Available" alt="No slides available" loading="lazy">
                    <div class="slide-content">
                        <h1>Content Coming Soon</h1>
                        <p>Check back later for exciting updates!</p>
                    </div>
                </div>`;
            if (controls) controls.style.display = 'none';
            return false; // No actual slides rendered
        }

        slidesData.forEach((data, slideIndex) => {
            const slideDiv = document.createElement('div');
            slideDiv.classList.add('slide');
            if (slideIndex === 0) {
                slideDiv.classList.add('active');
            }

            const img = document.createElement('img');
            img.src = data.imageUrl || `https://placehold.co/1200x500/cccccc/333333?text=Slide+${slideIndex + 1}`;
            img.alt = data.heading || `Hero slide image ${slideIndex + 1}`;
            img.loading = 'lazy';
            img.onerror = function() {
                this.src = `https://placehold.co/1200x500/ff0000/ffffff?text=Image+Load+Error`;
                this.alt = 'Image loading error';
            };

            const slideContentDiv = document.createElement('div');
            slideContentDiv.classList.add('slide-content');

            const h1 = document.createElement('h1');
            h1.textContent = data.heading || 'Default Heading';

            const p = document.createElement('p');
            p.textContent = data.paragraph || 'Default paragraph text.';

            const a = document.createElement('a');
            a.href = data.buttonUrl || '#';
            // Assuming 'btn' and 'btn-primary' are your desired classes for styling
            // If you use Tailwind, these might be different, e.g., 'py-2 px-4 bg-blue-500 text-white rounded-lg'
            a.className = 'btn btn-primary'; // Use className for setting multiple classes
            a.textContent = data.buttonText || 'Learn More';

            slideContentDiv.appendChild(h1);
            slideContentDiv.appendChild(p);
            slideContentDiv.appendChild(a);

            slideDiv.appendChild(img);
            slideDiv.appendChild(slideContentDiv);
            sliderContainer.appendChild(slideDiv);

            const dotSpan = document.createElement('span');
            dotSpan.classList.add('dot');
            if (slideIndex === 0) {
                dotSpan.classList.add('active');
            }
            dotSpan.setAttribute('data-index', slideIndex.toString());
            dotsContainer.appendChild(dotSpan);
        });

        if (controls) controls.style.display = ''; // Show controls as slides are present
        return true; // Slides were rendered
    }


    async function displayHeroSlides() {
        if (!heroSliderContainer || !sliderDotsContainer) {
            console.error("Hero slider or dots container not found in the DOM.");
            // Optionally, display an error in a more user-visible way if these core elements are missing
            return;
        }

        let cachedSlidesData = null;
        let renderedFromCache = false;

        // 1. Try to load from Local Storage
        try {
            const cachedDataString = localStorage.getItem(LOCAL_STORAGE_KEY_SLIDES);
            if (cachedDataString) {
                cachedSlidesData = JSON.parse(cachedDataString);
                console.log("Loaded slides from local storage.");
                if (cachedSlidesData && cachedSlidesData.length > 0) {
                    if (renderSlidesUI(cachedSlidesData, heroSliderContainer, sliderDotsContainer)) {
                        renderedFromCache = true;
                        if (typeof initializeSlider === 'function') {
                            const dynamicSlides = heroSliderContainer.querySelectorAll('.slide');
                            const dynamicDots = sliderDotsContainer.querySelectorAll('.dot');
                            initializeSlider(dynamicSlides, dynamicDots);
                        } else {
                            console.error("initializeSlider function is not defined. Slider will not work with cached data.");
                        }
                    }
                } else { // Cache exists but is empty (e.g. Firestore was empty on last fetch)
                    renderSlidesUI([], heroSliderContainer, sliderDotsContainer); // Show "empty" state
                }
            }
        } catch (e) {
            console.error("Error reading from local storage or parsing cached slides:", e);
            localStorage.removeItem(LOCAL_STORAGE_KEY_SLIDES); // Clear potentially corrupted cache
            cachedSlidesData = null; // Ensure it's null if parsing failed
        }

        // 2. Fetch from Firestore
        try {
            const snapshot = await heroCollection.orderBy('order', 'asc').get();
            const firestoreSlidesArray = [];

            if (snapshot.empty) {
                console.log("No hero slides found in Firestore. Displaying 'empty' state.");
                renderSlidesUI([], heroSliderContainer, sliderDotsContainer); // Show "empty" placeholder
                localStorage.setItem(LOCAL_STORAGE_KEY_SLIDES, JSON.stringify([])); // Cache the empty state
                // initializeSlider should not be called if no slides
                return; // Exit after handling empty Firestore result
            }

            snapshot.forEach(doc => {
                // It's good practice to ensure the data has the expected fields
                const data = doc.data();
                firestoreSlidesArray.push({
                    imageUrl: data.imageUrl || '',
                    heading: data.heading || '',
                    paragraph: data.paragraph || '',
                    buttonUrl: data.buttonUrl || '#',
                    buttonText: data.buttonText || 'Learn More',
                    // Include order if you need it for any client-side logic, though orderBy handles it for display
                    order: data.order
                });
            });

            console.log("Fetched slides from Firestore.");
            // Render Firestore data and update cache. This will overwrite cached display if it was shown.
            if (renderSlidesUI(firestoreSlidesArray, heroSliderContainer, sliderDotsContainer)) {
                localStorage.setItem(LOCAL_STORAGE_KEY_SLIDES, JSON.stringify(firestoreSlidesArray));
                console.log("Updated local storage with Firestore slides.");

                if (typeof initializeSlider === 'function') {
                    const dynamicSlides = heroSliderContainer.querySelectorAll('.slide');
                    const dynamicDots = sliderDotsContainer.querySelectorAll('.dot');
                    initializeSlider(dynamicSlides, dynamicDots);
                } else {
                    console.error("initializeSlider function is not defined. Slider will not work with Firestore data.");
                }
            }

        } catch (error) {
            console.error("Error fetching hero slides from Firestore:", error);
            // If Firestore fails, but we successfully rendered from cache, we keep showing cached data.
            // If cache was not available or also failed, then show the main error message.
            if (!renderedFromCache) {
                heroSliderContainer.innerHTML = `
                    <div class="slide active">
                        <img src="https://placehold.co/1200x500/ff0000/ffffff?text=Error+Fetching+Slides" alt="Error loading content" loading="lazy">
                        <div class="slide-content">
                            <h1>Error Fetching Slides</h1>
                            <p>There was an issue retrieving content. Please try refreshing the page or check back later.</p>
                        </div>
                    </div>`;
                sliderDotsContainer.innerHTML = ''; // Clear dots on error
                const controls = document.querySelector('.slider-controls');
                if (controls) controls.style.display = 'none'; // Hide controls on error
            } else {
                console.log("Firestore fetch failed. Continuing to display data from local storage.");
            }
        }
    }

    // Call the function to display hero slides
    displayHeroSlides();
});









// document.addEventListener('DOMContentLoaded', () => {
//     // Ensure Firebase is initialized (it should be by firebase-config.js)
//     if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
//         console.error("Firebase not initialized. Make sure firebase-config.js is loaded before this script.");
//         // Display a user-friendly message or use a placeholder
//         const heroSliderContainer = document.getElementById('hero-slider');
//         if (heroSliderContainer) {
//             heroSliderContainer.innerHTML = `
//                 <div class="slide active">
//                     <img src="frontend/images/placeholder-error.jpg" alt="Error loading content" loading="lazy">
//                     <div class="slide-content">
//                         <h1>Error</h1>
//                         <p>Could not load dynamic content. Please check your connection or try again later.</p>
//                     </div>
//                 </div>`;
//         }
//         // Hide slider controls if Firebase fails
//         const sliderControls = document.querySelector('.slider-controls');
//         if (sliderControls) sliderControls.style.display = 'none';
//         return;
//     }

//     const db = firebase.firestore();
//     const heroCollection = db.collection('hero_section');

//     const heroSliderContainer = document.getElementById('hero-slider');
//     const sliderDotsContainer = document.getElementById('slider-dots');
//     const HERO_SLIDES_CACHE_KEY = 'heroSlidesCache';

//     async function displayHeroSlides() {
//         if (!heroSliderContainer || !sliderDotsContainer) {
//             console.error("Hero slider or dots container not found in the DOM.");
//             return;
//         }

//         // Function to render slides
//         function renderSlides(slides) {
//             heroSliderContainer.innerHTML = '';
//             sliderDotsContainer.innerHTML = '';
//             slides.forEach((slide, index) => {
//                 const slideDiv = document.createElement('div');
//                 slideDiv.classList.add('slide');
//                 if (index === 0) {
//                     slideDiv.classList.add('active');
//                 }

//                 const img = document.createElement('img');
//                 img.src = slide.imageUrl || 'frontend/images/Place-Holder-Hero.webp'; // Fallback image
//                 img.alt = slide.heading || 'Hero slide image'; // Use heading for alt text
//                 img.loading = 'lazy';

//                 const slideContentDiv = document.createElement('div');
//                 slideContentDiv.classList.add('slide-content');

//                 const h1 = document.createElement('h1');
//                 h1.textContent = slide.heading || 'Default Heading';

//                 const p = document.createElement('p');
//                 p.textContent = slide.paragraph || 'Default paragraph text.';

//                 const a = document.createElement('a');
//                 a.href = slide.buttonUrl || '#';
//                 a.classList.add('btn', 'btn-primary');
//                 a.textContent = slide.buttonText || 'Learn More';

//                 slideContentDiv.appendChild(h1);
//                 slideContentDiv.appendChild(p);
//                 slideContentDiv.appendChild(a);

//                 slideDiv.appendChild(img);
//                 slideDiv.appendChild(slideContentDiv);
//                 heroSliderContainer.appendChild(slideDiv);

//                 const dotSpan = document.createElement('span');
//                 dotSpan.classList.add('dot');
//                 if (index === 0) {
//                     dotSpan.classList.add('active');
//                 }
//                 dotSpan.setAttribute('data-index', index.toString());
//                 sliderDotsContainer.appendChild(dotSpan);
//             });

//             // Reinitialize the slider after rendering slides
//             if (typeof initializeSlider === 'function') {
//                 const dynamicSlides = heroSliderContainer.querySelectorAll('.slide');
//                 const dynamicDots = sliderDotsContainer.querySelectorAll('.dot');
//                 initializeSlider(dynamicSlides, dynamicDots);
//             } else {
//                 console.error("initializeSlider function is not defined. Slider functionality will not work.");
//             }
//         }

//         // Load cached slides from local storage
//         const cachedSlides = JSON.parse(localStorage.getItem(HERO_SLIDES_CACHE_KEY));
//         if (cachedSlides && cachedSlides.length > 0) {
//             console.log("Using cached slides.");
//             renderSlides(cachedSlides);
//         }

//         // Fetch fresh slides from Firestore
//         try {
//             const snapshot = await heroCollection.orderBy('order', 'asc').get();

//             if (snapshot.empty) {
//                 console.log("No hero slides found in Firestore.");
//                 heroSliderContainer.innerHTML = `
//                 <div class="slide active">
//                     <img src="frontend/images/placeholder-empty.jpg" alt="No slides available" loading="lazy">
//                     <div class="slide-content">
//                         <h1>Content Coming Soon</h1>
//                         <p>Check back later for exciting updates!</p>
//                     </div>
//                 </div>`;
//                 sliderDotsContainer.innerHTML = ''; // No dots if no slides
//                 const controls = document.querySelector('.slider-controls');
//                 if (controls) controls.style.display = 'none';
//                 return;
//             }

//             const slides = snapshot.docs.map(doc => doc.data());
//             renderSlides(slides);

//             // Update cache with fresh slides
//             localStorage.setItem(HERO_SLIDES_CACHE_KEY, JSON.stringify(slides));
//         } catch (error) {
//             console.error("Error fetching hero slides:", error);
//             heroSliderContainer.innerHTML = `
//                 <div class="slide active">
//                     <img src="frontend/images/placeholder-error.jpg" alt="Error loading content" loading="lazy">
//                     <div class="slide-content">
//                         <h1>Error Fetching Slides</h1>
//                         <p>There was an issue retrieving content. Please try refreshing the page.</p>
//                     </div>
//                 </div>`;
//             const controls = document.querySelector('.slider-controls');
//             if (controls) controls.style.display = 'none';
//         }
//     }

//     // Call the function to display hero slides
//     displayHeroSlides();
// });  

// //  Local Storage for Caching
// document.addEventListener('DOMContentLoaded', async () => {
//     const heroSliderContainer = document.getElementById('hero-slider');
//     const sliderDotsContainer = document.getElementById('slider-dots');
//     const HERO_SLIDES_CACHE_KEY = 'heroSlidesCache';

//     if (!heroSliderContainer || !sliderDotsContainer) {
//         console.error("Hero slider or dots container not found in the DOM.");
//         return;
//     }

//     // Function to render slides
//     function renderSlides(slides) {
//         heroSliderContainer.innerHTML = '';
//         sliderDotsContainer.innerHTML = '';
//         slides.forEach((slide, index) => {
//             const slideDiv = document.createElement('div');
//             slideDiv.classList.add('slide');
//             if (index === 0) slideDiv.classList.add('active');

//             const img = document.createElement('img');
//             img.src = slide.imageUrl || 'frontend/images/Place-Holder-Hero.webp';
//             img.alt = slide.heading || 'Hero slide image';
//             img.loading = 'lazy';

//             const slideContentDiv = document.createElement('div');
//             slideContentDiv.classList.add('slide-content');

//             const h1 = document.createElement('h1');
//             h1.textContent = slide.heading || 'Default Heading';

//             const p = document.createElement('p');
//             p.textContent = slide.paragraph || 'Default paragraph text.';

//             const a = document.createElement('a');
//             a.href = slide.buttonUrl || '#';
//             a.classList.add('btn', 'btn-primary');
//             a.textContent = slide.buttonText || 'Learn More';

//             slideContentDiv.appendChild(h1);
//             slideContentDiv.appendChild(p);
//             slideContentDiv.appendChild(a);
//             slideDiv.appendChild(img);
//             slideDiv.appendChild(slideContentDiv);
//             heroSliderContainer.appendChild(slideDiv);

//             const dotSpan = document.createElement('span');
//             dotSpan.classList.add('dot');
//             if (index === 0) dotSpan.classList.add('active');
//             dotSpan.setAttribute('data-index', index.toString());
//             sliderDotsContainer.appendChild(dotSpan);
//         });
//     }

//     // Load cached slides
//     const cachedSlides = JSON.parse(localStorage.getItem(HERO_SLIDES_CACHE_KEY));
//     if (cachedSlides) {
//         renderSlides(cachedSlides);
//     }

//     // Fetch slides from Firestore
//     try {
//         const snapshot = await heroCollection.orderBy('order', 'asc').get();
//         if (!snapshot.empty) {
//             const slides = snapshot.docs.map(doc => doc.data());
//             renderSlides(slides);

//             // Update cache
//             localStorage.setItem(HERO_SLIDES_CACHE_KEY, JSON.stringify(slides));
//         } else {
//             console.log("No hero slides found in Firestore.");
//         }
//     } catch (error) {
//         console.error("Error fetching hero slides:", error);
//     }
// });


// document.addEventListener('DOMContentLoaded', async () => {
//     // Ensure Firebase is initialized
//     if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
//         console.error("Firebase not initialized. Make sure firebase-config.js is loaded before this script.");
//         displayErrorPlaceholder("Could not load dynamic content. Please check your connection or try again later.");
//         return;
//     }

//     const db = firebase.firestore();
//     const heroCollection = db.collection('hero_section');
//     const heroSliderContainer = document.getElementById('hero-slider');
//     const sliderDotsContainer = document.getElementById('slider-dots');
//     const HERO_SLIDES_CACHE_KEY = 'heroSlidesCache';

//     if (!heroSliderContainer || !sliderDotsContainer) {
//         console.error("Hero slider or dots container not found in the DOM.");
//         return;
//     }

//     // Function to display an error placeholder
//     function displayErrorPlaceholder(message) {
//         heroSliderContainer.innerHTML = `
//             <div class="slide active">
//                 <img src="frontend/images/placeholder-error.jpg" alt="Error loading content" loading="lazy">
//                 <div class="slide-content">
//                     <h1>Error</h1>
//                     <p>${message}</p>
//                 </div>
//             </div>`;
//         const sliderControls = document.querySelector('.slider-controls');
//         if (sliderControls) sliderControls.style.display = 'none';
//     }

//     // Function to render slides
//     function renderSlides(slides) {
//         heroSliderContainer.innerHTML = '';
//         sliderDotsContainer.innerHTML = '';
//         slides.forEach((slide, index) => {
//             const slideDiv = document.createElement('div');
//             slideDiv.classList.add('slide');
//             if (index === 0) slideDiv.classList.add('active');

//             const img = document.createElement('img');
//             img.src = slide.imageUrl || 'frontend/images/placeholder-default.jpg';
//             img.alt = slide.heading || 'Hero slide image';
//             img.loading = 'lazy';

//             const slideContentDiv = document.createElement('div');
//             slideContentDiv.classList.add('slide-content');

//             const h1 = document.createElement('h1');
//             h1.textContent = slide.heading || 'Default Heading';

//             const p = document.createElement('p');
//             p.textContent = slide.paragraph || 'Default paragraph text.';

//             const a = document.createElement('a');
//             a.href = slide.buttonUrl || '#';
//             a.classList.add('btn', 'btn-primary');
//             a.textContent = slide.buttonText || 'Learn More';

//             slideContentDiv.appendChild(h1);
//             slideContentDiv.appendChild(p);
//             slideContentDiv.appendChild(a);
//             slideDiv.appendChild(img);
//             slideDiv.appendChild(slideContentDiv);
//             heroSliderContainer.appendChild(slideDiv);

//             const dotSpan = document.createElement('span');
//             dotSpan.classList.add('dot');
//             if (index === 0) dotSpan.classList.add('active');
//             dotSpan.setAttribute('data-index', index.toString());
//             sliderDotsContainer.appendChild(dotSpan);
//         });
//     }

//     // Function to fetch slides from Firestore
//     async function fetchSlidesFromFirestore() {
//         try {
//             const snapshot = await heroCollection.orderBy('order', 'asc').get();
//             if (!snapshot.empty) {
//                 const slides = snapshot.docs.map(doc => doc.data());
//                 renderSlides(slides);
//                 localStorage.setItem(HERO_SLIDES_CACHE_KEY, JSON.stringify(slides));
//                 return slides;
//             } else {
//                 console.log("No hero slides found in Firestore.");
//                 displayErrorPlaceholder("Content Coming Soon. Check back later for exciting updates!");
//                 return [];
//             }
//         } catch (error) {
//             console.error("Error fetching hero slides:", error);
//             displayErrorPlaceholder("There was an issue retrieving content. Please try refreshing the page.");
//             return [];
//         }
//     }

//     // Load cached slides if available
//     const cachedSlides = JSON.parse(localStorage.getItem(HERO_SLIDES_CACHE_KEY));
//     if (cachedSlides && cachedSlides.length > 0) {
//         renderSlides(cachedSlides);
//     }

//     // Fetch fresh slides from Firestore
//     const freshSlides = await fetchSlidesFromFirestore();

//     // Re-initialize the slider logic if fresh slides are fetched
//     if (freshSlides.length > 0 && typeof initializeSlider === 'function') {
//         const dynamicSlides = heroSliderContainer.querySelectorAll('.slide');
//         const dynamicDots = sliderDotsContainer.querySelectorAll('.dot');
//         initializeSlider(dynamicSlides, dynamicDots);
//         const sliderControls = document.querySelector('.slider-controls');
//         if (sliderControls) sliderControls.style.display = ''; // Make controls visible
//     }
// });