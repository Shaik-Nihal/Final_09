# Apollo Knowledge Website - Content Management System (CMS) Documentation

## 1. Introduction

This document provides an overview and usage guide for the Content Management System (CMS) built for the Apollo Knowledge website. This CMS allows authorized users to update specific content on the website directly, without needing to modify the code.

The CMS provides functionality to manage:
*   **Homepage Hero Slides:** The rotating promotional slides on the main homepage.
*   **Programs Page Hero:** The main title and introductory paragraph on the "Our Programs" page.
*   **Program Cards:** The individual cards that display each program offering on both the homepage and the "Our Programs" page.

This CMS uses **Firebase** (Firestore database) as its backend to store and manage the content. Image URLs are stored in Firestore, but the images themselves are hosted on third-party services.

## 2. Firebase Project Setup (Recap & Client Action)

For the CMS to function, a Firebase project must be correctly set up and configured with the website.

*   **Initial Firebase Project Creation & SDK Setup:**
    Please refer to the **`FIREBASE_SETUP_INSTRUCTIONS.md`** document (provided earlier) for detailed steps on:
    1.  Creating a Firebase project.
    2.  Obtaining your Firebase project configuration (`firebaseConfig` object).
    3.  Updating the `frontend/scripts/firebase-config.js` file with your project's specific `firebaseConfig`.
    4.  Setting up Firestore rules (Storage rules are not directly used by the CMS for image handling).

*   **Crucial: Creating Admin User Accounts**

    To log into the admin panel, you need to manually create user accounts in the Firebase Authentication section. **The CMS does not have a public sign-up page for admin users.**

    Follow these steps:
    1.  Go to the [Firebase Console](https://console.firebase.google.com/).
    2.  Select your project.
    3.  In the left-hand navigation menu, under "Build", click on **Authentication**.
    4.  If this is your first time, click "Get started".
    5.  Navigate to the **"Users"** tab (it's usually the default tab).
    6.  Click the **"Add user"** button.
        ![Firebase Add User Button](https://firebase.google.com/static/docs/auth/images/add-user.png) *(Image for illustrative purposes)*
    7.  A dialog box will appear:
        *   Enter the **email address** for the admin user.
        *   Enter a **strong, unique password** for this user.
        *   You do not need to add a User UID; Firebase will generate one.
    8.  Click **"Add user"**.
    9.  Repeat these steps for any other admin users you wish to grant access to.

    **Password Recommendation:** Use strong, unique passwords for all admin accounts to ensure the security of your website's content management. Consider using a password manager.

    The email and password created here are what you will use to log into the CMS admin panel.

## 3. Firestore Data Structure Overview

The CMS uses Google Firestore to store data. Here's a brief overview of the collections and their purpose:

*   **`hero_section`**:
    *   **Purpose:** Stores the individual slides for the hero carousel on the website's homepage.
    *   **Fields for each document (slide):**
        *   `imageUrl` (string): URL of the slide's background image.
        *   `heading` (string): The main headline text for the slide.
        *   `paragraph` (string): The descriptive paragraph text for the slide.
        *   `buttonText` (string): Text for the call-to-action button on the slide.
        *   `buttonUrl` (string): URL where the button links to.
        *   `order` (number): A number determining the display sequence of the slide (e.g., 1 for first, 2 for second).
        *   `createdAt` (timestamp): Automatically added when a slide is created.
        *   `updatedAt` (timestamp): Automatically updated when a slide is modified.

*   **`programs_page`**:
    *   **Purpose:** Stores content specifically for the hero section of the "Our Programs" page.
    *   **Document ID:** This collection typically holds a single document with a specific ID: `main_content`.
    *   **Fields within the `main_content` document:**
        *   `heroTitle` (string): The main title for the programs page hero section.
        *   `heroParagraph` (string): The introductory paragraph for the programs page hero section.
        *   `lastUpdated` (timestamp): Automatically updated when this content is modified.

*   **`programs`**:
    *   **Purpose:** Stores the individual program cards that appear on the homepage and the "Our Programs" page.
    *   **Fields for each document (program card):**
        *   `imageUrl` (string): URL of the image for the program card.
        *   `title` (string): The title of the program.
        *   `description` (string): A short description of the program.
        *   `duration` (string): The duration of the program (e.g., "3 Years", "1 Year").
        *   `linkUrl` (string): The URL to the specific page for that program (e.g., `programs/medical-laboratory-technology.html`).
        *   `order` (number): A number determining the display sequence of the card.
        *   `createdAt` (timestamp): Automatically added when a card is created.
        *   `updatedAt` (timestamp): Automatically updated when a card is modified.

    *   **`accreditations_homepage`**:
        *   **Purpose:** Stores accreditation and affiliation items for display on the homepage.
        *   **Fields for each document (accreditation item):**
            *   `name` (string): Name of the accrediting or affiliating body (e.g., "University Grants Commission").
            *   `logoUrl` (string): URL to the logo image of the body.
            *   `order` (number): A number determining the display sequence of the logo.
            *   `createdAt` (timestamp): Automatically added when an item is created.
            *   `updatedAt` (timestamp): Automatically updated when an item is modified.

    *   **`global_connections_homepage`**:
        *   **Purpose:** Stores global connection/partnership items for display on the homepage.
        *   **Fields for each document (connection item):**
            *   `name` (string): Name of the partner institution (e.g., "Harvard Medical School").
            *   `description` (string): A brief description of the partnership.
            *   `imageUrl` (string): URL to an image representing the partner.
            *   `order` (number): A number determining the display sequence.
            *   `createdAt` (timestamp): Automatically added when an item is created.
            *   `updatedAt` (timestamp): Automatically updated when an item is modified.

    *   **`centers_list`**:
        *   **Purpose:** Stores information about the different Apollo Knowledge centers.
        *   **Fields for each document (center item):**
            *   `name` (string): Name of the center (e.g., "Chennai").
            *   `imageUrl` (string): URL for the center's representative image.
            *   `description` (string): A short description of the center.
            *   `pageUrl` (string): Relative URL to the center's specific page (e.g., "centres/chennai/" or "centres/chennai/index.html").
            *   `mapEmbedCode` (string, optional): Full iframe embed code for Google Maps.
            *   `order` (number): A number determining the display sequence.
            *   `createdAt` (timestamp): Automatically added when an item is created.
            *   `updatedAt` (timestamp): Automatically updated when an item is modified.

    *   **`homepage_content`**:
        *   **Purpose:** Stores miscellaneous content for the homepage that doesn't fit into other specific collections.
        *   **Documents:** Currently, one document is planned:
            *   `our_programs_section_details`:
                *   `title` (string): The title for the "Our Programs" section on the homepage.
                *   `introParagraph` (string): The introductory paragraph for this section.
                *   `lastUpdated` (timestamp): Automatically updated when these details are modified.

## 4. Admin Panel Usage Guide

### Accessing the Admin Panel

1.  Once the website is deployed, you can typically access the admin panel by navigating to:
    *   `yourwebsite.com/admin/`
    *   or `yourwebsite.com/admin/index.html`
    (Replace `yourwebsite.com` with your actual domain name).
2.  You will see a login page asking for an Email and Password.
3.  Enter the email and password of an admin user that you created in the Firebase Authentication section (Step 2).
4.  Click the "Login" button.

### Dashboard Overview

Upon successful login, you will be redirected to the Admin Dashboard. The dashboard is divided into sections for managing different parts of your website:

*   **Hero Section Slides:** For managing the slides on the homepage hero carousel.
*   **Programs Page Hero:** For editing the title and paragraph of the hero section on the "Our Programs" page.
*   **Program Cards:** For managing the individual program cards.
*   **Accreditations & Affiliations Management:** For managing the logos and names of accrediting bodies displayed on the homepage.
*   **Global Connections Management:** For managing the international partnership cards on the homepage.
*   **Centers List Management:** For managing the center cards displayed on the homepage and the main centers listing page.
*   **Homepage 'Our Programs' Section Details:** For managing the title and intro paragraph of the "Our Programs" section on the homepage.

There is also a **"Logout"** button in the header to securely log out of the admin panel.

### Managing Homepage Hero Slides

This section allows you to control the content of the rotating hero slides on your homepage.

*   **Viewing Existing Slides:**
    *   On the right side of this section, you'll see a list titled "Existing Hero Slides".
    *   Each slide in the list shows its heading, a snippet of its paragraph, its display order, and a small preview of its image (if available).
*   **Adding a New Slide:**
    1.  Use the form on the left side, titled "Add New Hero Slide".
    2.  **Heading:** Enter the main text for the slide.
    3.  **Paragraph:** Enter the supporting text.
    4.  **Button Text:** Enter the text for the button (e.g., "Learn More", "Explore Programs").
    5.  **Button URL:** Enter the full URL where this button should link (e.g., `/frontend/programs.html`, `https://example.com/another-page`).
    6.  **Order:** Enter a number. Slides will be displayed in ascending order (e.g., 1 will show before 2).
    7.  **Slide Image URL:**
        *   Upload your desired image to a third-party image hosting service (e.g., Imgur, Cloudinary's free tier, your own web server if you have one).
        *   Copy the direct link (URL) to the uploaded image. This URL should end with an image extension (e.g., `.jpg`, `.png`, `.webp`).
        *   Paste this URL into the "Slide Image URL" text field.
    8.  Click **"Save Slide"**. The new slide will appear in the "Existing Hero Slides" list.
*   **Editing an Existing Slide:**
    1.  In the "Existing Hero Slides" list, find the slide you want to edit.
    2.  Click the **"Edit"** button next to it.
    3.  The form on the left will populate with the slide's current information, and its title will change to "Edit Hero Slide". The current image URL will be in the "Slide Image URL" field.
    4.  Modify any fields as needed. To change the image, replace the URL in the "Slide Image URL" field with a new direct image link.
    5.  Click **"Update Slide"**. The changes will be saved, and the list will refresh.
    6.  A "Cancel Edit" button will appear to clear the form and revert to "Add New" mode.
*   **Deleting a Slide:**
    1.  In the "Existing Hero Slides" list, click the **"Delete"** button next to the slide you want to remove.
    2.  A confirmation prompt will appear: "Are you sure you want to delete this slide?".
    3.  Click "OK" to confirm. The slide will be removed from the list and the website. (Note: The image itself, being hosted externally, will not be deleted by this action).
*   **Importance of `Order` Field:** The `order` field is crucial. Slides are displayed based on this number, starting from the lowest. If multiple slides have the same order number, their specific sequence might vary.

### Managing Programs Page Hero

This section allows you to edit the main title and introductory paragraph on the "Our Programs" page.

1.  The form "Edit Programs Page Hero" will show the current title and paragraph.
2.  **Hero Title:** Modify the text in this field for the main heading.
3.  **Hero Paragraph:** Modify the text in this field for the introductory paragraph.
4.  Click **"Save Programs Hero"**.
5.  A status message will confirm if the save was successful or if there was an error.

### Managing Program Cards

This section allows you to control the program cards displayed on your website.

*   **Viewing Existing Program Cards:**
    *   On the right side, a list titled "Existing Program Cards" shows all current program cards with their title, a snippet of the description, display order, and image thumbnail.
*   **Adding a New Program Card:**
    1.  Use the form on the left, "Add New Program Card".
    2.  **Program Title:** The name of the program.
    3.  **Description:** A brief summary of the program.
    4.  **Program Duration:** E.g., "3 Years", "12 Months".
    5.  **"Learn More" Link URL:** The relative path to the program's detail page (e.g., `programs/health-service-management.html`).
    6.  **Display Order:** A number determining the sequence in which cards appear.
    7.  **Card Image URL:**
        *   Upload your desired image to a third-party image hosting service.
        *   Copy the direct link (URL) to the uploaded image.
        *   Paste this URL into the "Card Image URL" text field.
    8.  Click **"Save Program Card"**.
*   **Editing an Existing Program Card:**
    1.  In the "Existing Program Cards" list, click **"Edit"** next to the card.
    2.  The form populates with the card's details. The title changes to "Edit Program Card". The current image URL will be in the "Card Image URL" field.
    3.  Modify fields as needed. To change the image, replace the URL in the "Card Image URL" field.
    4.  Click **"Update Program Card"**.
    5.  A "Cancel Edit" button is available to reset the form.
*   **Deleting a Program Card:**
    1.  Click **"Delete"** next to the card in the list.
    2.  Confirm the deletion when prompted. The card will be removed. (Note: The image itself, being hosted externally, will not be deleted by this action).
*   **Importance of `Order` Field:** Program cards are displayed based on this number in ascending order.

### Managing Accreditations & Affiliations

This section allows you to manage the accreditations and affiliations logos and names displayed on the homepage.

*   **Viewing Existing Accreditations:**
    *   On the right side of this section, you'll see a list titled "Existing Accreditations".
    *   Each item in the list shows its name, display order, a link to the logo, and a small preview of the logo image.
*   **Adding a New Accreditation Item:**
    1.  Use the form on the left side, titled "Add New Accreditation".
    2.  **Name:** Enter the name of the accrediting or affiliating body (e.g., "University Grants Commission").
    3.  **Logo URL:**
        *   Upload the logo image to a third-party image hosting service.
        *   Copy the direct link (URL) to the uploaded image. This URL should end with an image extension (e.g., `.png`, `.svg`, `.jpg`).
        *   Paste this URL into the "Logo URL" text field.
    4.  **Order:** Enter a number. Items will be displayed in ascending order.
    5.  Click **"Save Accreditation"**. The new item will appear in the "Existing Accreditations" list.
*   **Editing an Existing Accreditation Item:**
    1.  In the "Existing Accreditations" list, find the item you want to edit.
    2.  Click the **"Edit"** button next to it.
    3.  The form on the left will populate with the item's current information, and its title will change to "Edit Accreditation".
    4.  Modify any fields as needed. To change the logo, replace the URL in the "Logo URL" field.
    5.  Click **"Update Accreditation"**. The changes will be saved, and the list will refresh.
    6.  A "Cancel Edit" button will appear to clear the form and revert to "Add New" mode.
*   **Deleting an Accreditation Item:**
    1.  In the "Existing Accreditations" list, click the **"Delete"** button next to the item.
    2.  A confirmation prompt will appear. Click "OK" to confirm.
    3.  The item will be removed from the list and the website. (The externally hosted logo image will not be deleted).
*   **Frontend Display:** These accreditations are loaded onto the homepage by the `frontend/scripts/accreditations-loader.js` script.

### Managing Global Connections

This section allows you to manage the global connections or international partnership cards displayed on the homepage.

*   **Viewing Existing Global Connections:**
    *   On the right side, a list titled "Existing Global Connections" shows all current items with their name, a snippet of the description, display order, and image thumbnail.
*   **Adding a New Global Connection:**
    1.  Use the form on the left, "Add New Global Connection".
    2.  **Name:** The name of the partner institution (e.g., "Harvard Medical School").
    3.  **Description:** A brief description of the partnership (e.g., "Faculty exchange program and research collaboration").
    4.  **Image URL:**
        *   Upload an image representing the partner to a third-party image hosting service.
        *   Copy the direct link (URL) to the uploaded image.
        *   Paste this URL into the "Image URL" text field.
    5.  **Order:** Enter a number. Items will be displayed in ascending order.
    6.  Click **"Save Connection"**.
*   **Editing an Existing Global Connection:**
    1.  In the "Existing Global Connections" list, click **"Edit"** next to the item.
    2.  The form populates with the item's details. The title changes to "Edit Global Connection".
    3.  Modify fields as needed. To change the image, replace the URL in the "Image URL" field.
    4.  Click **"Update Connection"**.
    5.  A "Cancel Edit" button is available to reset the form.
*   **Deleting a Global Connection:**
    1.  Click **"Delete"** next to the item in the list.
    2.  Confirm the deletion. The item will be removed. (The externally hosted image will not be deleted).
*   **Frontend Display:** These global connections are loaded onto the homepage by the `frontend/scripts/global-connections-loader.js` script.

### Managing Centers List

This section allows you to manage the center cards that appear on the homepage and the dedicated "Our Centres" listing page (`centres/index.html`).

*   **Viewing Existing Centers:**
    *   On the right side, a list titled "Existing Centers" shows all current center items with their name, a snippet of the description, page URL, display order, and image thumbnail.
*   **Adding a New Center:**
    1.  Use the form on the left, "Add New Center".
    2.  **Center Name:** The name of the center (e.g., "Chennai Campus").
    3.  **Image URL:** URL for the center's image.
    4.  **Description:** A short description of the center.
    5.  **Page URL:** The relative URL to the center's specific detail page (e.g., `centres/chennai/` or `centres/chennai/index.html`).
    6.  **Map Embed Code (iframe):** (Optional) Paste the full `<iframe>...</iframe>` code from Google Maps (Share > Embed a map) for the center's location.
    7.  **Order:** A number determining the display sequence.
    8.  Click **"Save Center"**.
*   **Editing an Existing Center:**
    1.  In the "Existing Centers" list, click **"Edit"** next to the item.
    2.  The form populates with the center's details.
    3.  Modify fields as needed.
    4.  Click **"Update Center"**.
*   **Deleting a Center:**
    1.  Click **"Delete"** next to the item in the list.
    2.  Confirm the deletion.
*   **Frontend Display:**
    *   Homepage: Loaded by `frontend/scripts/homepage-centers-loader.js`.
    *   Centers Listing Page (`centres/index.html`): Loaded by `frontend/scripts/centers-page-loader.js`.

### Managing Homepage "Our Programs" Section Details

This section allows you to edit the main title and introductory paragraph for the "Our Programs" section that appears on the homepage.

1.  The form "Edit 'Our Programs' Section Meta" will show the current title and paragraph.
2.  **Section Title:** Modify the text for the main heading of this section (e.g., "Our Programs", "Featured Programs").
3.  **Introductory Paragraph:** Modify the text for the paragraph that appears below the title.
4.  Click **"Save Details"**.
5.  A status message will confirm if the save was successful.
*   **Frontend Display:**
    *   The title and intro paragraph are loaded by `frontend/scripts/homepage-ourprograms-meta-loader.js`.
    *   The actual program cards in this section are loaded by `frontend/scripts/homepage-programs-loader.js` (from the `programs` collection) and are managed under the "Program Cards" section of the admin panel.

### Image Handling via URLs

The CMS now uses direct URLs for images. This means you host your images on a service of your choice and then provide the link to the CMS.

*   **Process:**
    1.  **Upload Image:** Upload your image to a third-party image hosting service (e.g., Imgur, Cloudinary's free tier, or your own web server).
    2.  **Get Direct Link:** Copy the direct link (URL) to the uploaded image. This URL must point directly to the image file itself (e.g., end in `.jpg`, `.png`, `.webp`), not to a webpage containing the image.
    3.  **Paste URL:** Paste this URL into the appropriate "Image URL" field in the admin panel form (e.g., "Slide Image URL" or "Card Image URL").
*   **Image Recommendations:**
    *   **Image Hosting Services:** Choose a reliable image hosting service that provides stable, direct links.
    *   **Optimization:** **It is highly recommended to optimize images for the web *before* uploading them to your chosen hosting service.** Large image files can significantly slow down page load times. Use tools like TinyPNG, ImageOptim, or Squoosh to reduce file sizes without sacrificing too much quality. Aim for JPEGs for photographic images and PNGs for graphics with transparency or sharp lines.
    *   **Accessibility:** Ensure your image URLs are publicly accessible so they can be displayed on your website.

## 5. Deployment to Firebase Hosting (Recap & Client Action)

For any changes made via the CMS to be visible on your live website, and for the CMS itself to be accessible, the entire website (including the `admin` folder and all updated HTML, CSS, and JavaScript files) must be deployed to Firebase Hosting.

*   **General Deployment:**
    *   Refer to **`FIREBASE_SETUP_INSTRUCTIONS.md`** for the initial setup of Firebase Hosting and the basic deployment command:
        ```bash
        firebase deploy
        ```
    *   This command should be run from the root directory of your project after you have made any code changes or if you are deploying for the first time.

*   **Deploying Firestore Rules:**
    *   The security rules for Firestore (`firestore.rules`) are crucial for protecting your data.
    *   If you've made changes to these files (e.g., when extending the CMS for a new page) or during the initial setup, deploy them specifically using:
        ```bash
        firebase deploy --only firestore
        ```
    *   It's good practice to deploy these rules whenever you deploy other Firebase features or if you've adjusted the rules.

## 6. Troubleshooting/FAQ

*   **"I can't log in to the admin panel."**
    *   **Check Credentials:** Double-check that you are using the exact email and password that were set up in the Firebase Console (Authentication -> Users). Passwords are case-sensitive.
    *   **User Existence:** Ensure the user account exists in Firebase Authentication.
    *   **Browser Issues:** Try clearing your browser's cache and cookies, or try a different browser/incognito mode.

*   **"Images are not showing up on the website or in the admin panel."**
    *   **Check Image URL:** Verify the URL pasted into the admin panel is correct, a direct link to the image, and publicly accessible. Test by opening the URL directly in your browser.
    *   **Check Image URLs in Firestore:** In Firestore, check the `imageUrl` field for the affected slide or card. Ensure the URL is correct.
    *   **Browser Console:** Open your browser's developer tools (usually by pressing F12) and check the "Console" tab for any error messages related to image loading (e.g., 403 Forbidden, 404 Not Found if the URL is incorrect or the image is not publicly accessible).

*   **"Content changes I made in the admin panel are not appearing on the live site."**
    *   **Save Confirmation:** Ensure you clicked "Save Slide", "Update Slide", "Save Programs Hero", or "Save Program Card" and received a success message in the admin panel.
    *   **Browser Cache:** Your browser might be showing an old (cached) version of the page. Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) or clear your browser cache.
    *   **Firebase Project Configuration:** Double-check that the `firebaseConfig` object in `frontend/scripts/firebase-config.js` points to the correct Firebase project where you are making admin changes.
    *   **Firestore Data:** Verify directly in the Firebase Firestore console that the data was actually updated as expected.

*   **Frontend Performance & Caching:**
    *   To improve loading speed and provide a smoother experience, the website's dynamic sections (like Hero Slides, Accreditations, Programs, etc.) use browser caching (localStorage). This means that after you visit a page, its content may load very quickly on subsequent visits, even before fetching the absolute latest updates from the server. The site will always try to get the latest content, but the cache helps in displaying information faster. If you've made a change in the CMS and don't see it immediately on the live site, a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) of your browser page can sometimes help ensure you're seeing the very latest version.

*   **"I'm seeing an error message when trying to save content."**
    *   Note down the error message shown in the admin panel or in the browser's developer console. This information can be helpful for diagnosing the issue. Common causes include network connectivity problems, incorrect Firebase rules (for write operations), or bugs in the CMS code.

## 7. Extending the CMS to Other Pages

This section provides a guide on how to extend the existing CMS functionality to manage content on other pages of your website. This requires some HTML, JavaScript, and Firebase knowledge.

### 1. Planning & Backup

*   **Identify the page and content:** Determine which HTML file (e.g., `frontend/about-us.html`) and which specific text or image elements you want to make editable. For example, you might want to edit a page title, an introductory paragraph, and an image URL.
*   **Backup your files:** Before making any code changes, always create a backup of your project files (especially `admin/dashboard.html`, `admin/dashboard.js`, the frontend HTML page you're modifying, and any new JavaScript files you create).

### 2. Firestore Data Design

*   **Create a new collection:** In your Firebase Firestore console, create a new collection for the page you want to manage. For example, if you're editing the "About Us" page, you could name the collection `about_us_content`.
*   **Define document structure:**
    *   Decide on a document ID within this collection. If the page has one main block of content you're managing, you could use a specific ID like `main_content`.
    *   Define the fields you'll need in this document. For example:
        *   `pageTitle` (string)
        *   `introductionParagraph` (string)
        *   `section1Header` (string)
        *   `section1Text` (string)
        *   `bannerImageUrl` (string)

### 3. Update Admin Panel (`admin/dashboard.html`)

1.  **Add a new HTML section:**
    *   Open `admin/dashboard.html`.
    *   Find an existing management section (e.g., the "Programs Page Hero" section is a simple one to copy).
    *   Duplicate this section and give it a new `id` (e.g., `<section id="about-us-content-management">`).
    *   Change the `<h2>` to reflect the new section (e.g., "About Us Page Content").
2.  **Create new form(s):**
    *   Inside your new section, adapt the copied form. Give the form a unique `id` (e.g., `id="about-us-form"`).
    *   Create input fields (`<input type="text">`, `<textarea>`) for each piece of content you want to manage.
    *   Each input field must have a unique `id` (e.g., `id="about-pageTitle"`, `id="about-introductionParagraph"`, `id="about-bannerImageUrl"`).
    *   Update labels (`<label for="...">`) to match the new input IDs.
    *   Update the save button's `id` and text (e.g., `id="save-about-us-button"`, text: "Save About Us Content").
    *   Create a `div` for status messages with a unique `id` (e.g., `id="about-us-status"`).

    **Example HTML snippet for `admin/dashboard.html`:**
    ```html
    <section id="about-us-content-management">
        <h2>About Us Page Content</h2>
        <p>Manage content for the About Us page.</p>
        <div class="form-container"> <!-- Or your preferred layout class -->
            <h3>Edit About Us Content</h3>
            <form id="about-us-form">
                <div class="input-group">
                    <label for="about-pageTitle">Page Title</label>
                    <input type="text" id="about-pageTitle" name="pageTitle" required>
                </div>
                <div class="input-group">
                    <label for="about-introductionParagraph">Introduction Paragraph</label>
                    <textarea id="about-introductionParagraph" name="introductionParagraph" rows="5" required></textarea>
                </div>
                <div class="input-group">
                    <label for="about-bannerImageUrl">Banner Image URL</label>
                    <input type="text" id="about-bannerImageUrl" name="bannerImageUrl">
                </div>
                <div class="form-actions">
                    <button type="submit" id="save-about-us-button" class="btn">Save About Us Content</button>
                </div>
                <div id="about-us-status" style="margin-top: 15px;"></div>
            </form>
        </div>
    </section>
    ```

### 4. Update Admin Panel JavaScript (`admin/dashboard.js`)

1.  **Add Firestore references:**
    At the top of the script (near other `db.collection` lines), add a reference to your new collection:
    ```javascript
    const aboutUsCollection = db.collection('about_us_content'); 
    const aboutUsDocId = 'main_content'; // Or your chosen document ID
    ```
2.  **Get references to new form elements:**
    ```javascript
    const aboutUsForm = document.getElementById('about-us-form');
    const aboutPageTitleInput = document.getElementById('about-pageTitle');
    const aboutIntroductionParagraphInput = document.getElementById('about-introductionParagraph');
    const aboutBannerImageUrlInput = document.getElementById('about-bannerImageUrl');
    const aboutUsStatusDiv = document.getElementById('about-us-status');
    const saveAboutUsButton = document.getElementById('save-about-us-button');
    ```
3.  **Implement `loadAboutUsContent()` function:**
    This function will fetch data from Firestore and populate your new admin form.
    ```javascript
    async function loadAboutUsContent() {
        if (!aboutPageTitleInput || !aboutIntroductionParagraphInput /* add other inputs */) return;
        try {
            const doc = await aboutUsCollection.doc(aboutUsDocId).get();
            if (doc.exists) {
                const data = doc.data();
                aboutPageTitleInput.value = data.pageTitle || '';
                aboutIntroductionParagraphInput.value = data.introductionParagraph || '';
                aboutBannerImageUrlInput.value = data.bannerImageUrl || '';
                // Populate other fields as needed
                showMessage(aboutUsStatusDiv, "Content loaded.", true);
            } else {
                showMessage(aboutUsStatusDiv, "No existing content found. Add new content.", false);
                // Optionally clear fields if no content:
                // aboutPageTitleInput.value = ''; 
                // aboutIntroductionParagraphInput.value = '';
                // aboutBannerImageUrlInput.value = '';
            }
        } catch (error) {
            console.error("Error loading About Us content:", error);
            showMessage(aboutUsStatusDiv, "Error loading content: " + error.message, false);
        }
    }
    ```
4.  **Implement form submission logic:**
    This function saves the data from your form to Firestore.
    ```javascript
    if (aboutUsForm) {
        aboutUsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!auth.currentUser) {
                showMessage(aboutUsStatusDiv, "You must be logged in to save.", false);
                return;
            }

            const dataToSave = {
                pageTitle: aboutPageTitleInput.value.trim(),
                introductionParagraph: aboutIntroductionParagraphInput.value.trim(),
                bannerImageUrl: aboutBannerImageUrlInput.value.trim(),
                // Add other fields
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (saveAboutUsButton) saveAboutUsButton.disabled = true;
            try {
                await aboutUsCollection.doc(aboutUsDocId).set(dataToSave, { merge: true });
                showMessage(aboutUsStatusDiv, "About Us content saved successfully!", true);
            } catch (error) {
                console.error("Error saving About Us content:", error);
                showMessage(aboutUsStatusDiv, "Error saving content: " + error.message, false);
            } finally {
                if (saveAboutUsButton) saveAboutUsButton.disabled = false;
            }
        });
    }
    ```
5.  **Call `loadAboutUsContent()` on dashboard load:**
    Inside the `auth.onAuthStateChanged((user) => { ... })` block, where other `load...()` functions are called:
    ```javascript
    if (user) {
        // ... other load functions
        loadAboutUsContent(); 
    }
    ```

### 5. Modify Frontend HTML Page (e.g., `frontend/about-us.html`)

1.  **Include Firebase SDKs:**
    Ensure the following scripts are in the `<head>` or before the closing `</body>` tag (before your custom script):
    ```html
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <!-- <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script> Not needed if page is public -->
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
    <script src="/frontend/scripts/firebase-config.js"></script> <!-- Adjust path as needed -->
    ```
2.  **Add `id` attributes to HTML elements:**
    Go to the HTML elements on your page that you want to update and give them unique `id` attributes.
    ```html
    <h1 id="about-page-main-title">Default Title</h1>
    <p id="about-intro-text">Default introduction paragraph...</p>
    <img id="about-banner-image" src="default-image.jpg" alt="Banner">
    ```
3.  **Link your new JavaScript file:**
    Add a script tag for a new JavaScript file that will handle fetching and displaying the content for this page. Place it before the closing `</body>` tag.
    ```html
    <script src="/frontend/scripts/about-us-content.js"></script> <!-- Adjust path as needed -->
    ```

### 6. Create Frontend JavaScript (e.g., `frontend/scripts/about-us-content.js`)

Create a new file (e.g., `frontend/scripts/about-us-content.js`). This script will fetch data from Firestore and update the HTML.

```javascript
document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error("Firebase not initialized for about-us page.");
        // Handle error display on the page if necessary
        return;
    }

    const db = firebase.firestore();
    const aboutUsCollectionName = 'about_us_content'; // Same as in admin panel
    const aboutUsDocId = 'main_content';         // Same as in admin panel

    async function displayAboutUsContent() {
        try {
            const doc = await db.collection(aboutUsCollectionName).doc(aboutUsDocId).get();

            if (doc.exists) {
                const data = doc.data();

                const titleElement = document.getElementById('about-page-main-title');
                if (titleElement && data.pageTitle) {
                    titleElement.textContent = data.pageTitle;
                }

                const introElement = document.getElementById('about-intro-text');
                if (introElement && data.introductionParagraph) {
                    introElement.textContent = data.introductionParagraph;
                }
                
                const bannerImgElement = document.getElementById('about-banner-image');
                if (bannerImgElement && data.bannerImageUrl) {
                    bannerImgElement.src = data.bannerImageUrl;
                    // Optionally update alt text if you have a field for it
                    // bannerImgElement.alt = data.bannerImageAltText || "About Us Banner"; 
                }
                
                // Update other elements as needed

            } else {
                console.log("About Us content document not found.");
                // Keep default static content or hide sections
            }
        } catch (error) {
            console.error("Error fetching About Us content for frontend:", error);
            // Handle error display on the page if necessary
        }
    }

    displayAboutUsContent();
});
```

### 7. Update Firestore Rules (`firestore.rules`)

You need to allow public read access to your new collection so the frontend can display the data.

1.  Open your `firestore.rules` file.
2.  Add a new `match` block for your collection. For example:
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // ... your existing rules for hero_section, programs_page, programs ...

        // Rule for the new About Us content
        match /about_us_content/{docId} {
          allow read: if true;
          allow write: if request.auth != null; // Only authenticated users (admins) can write
        }

        // Rule for the accreditations_homepage collection
        match /accreditations_homepage/{accreditationId} {
          allow read: if true;
          allow write: if request.auth != null;
        }

        // Rule for the global_connections_homepage collection
        match /global_connections_homepage/{gcId} {
          allow read: if true;
          allow write: if request.auth != null;
        }

        // Rule for the centers_list collection
        match /centers_list/{centerId} {
          allow read: if true;
          allow write: if request.auth != null;
        }

        // Rule for the homepage_content collection
        match /homepage_content/{docId} {
          allow read: if true;
          allow write: if request.auth != null;
        }
      }
    }
    ```
3.  **Deploy the updated rules:**
    Open your terminal, navigate to your project root, and run:
    ```bash
    firebase deploy --only firestore
    ```

### 8. Testing

*   **Admin Panel:** Go to your admin panel and navigate to the new section you created. Try adding or editing content and saving it. Check for any console errors.
*   **Frontend Page:** Open the live frontend page (e.g., `about-us.html`). Verify that the content you saved in the admin panel is correctly displayed.
*   **Hard Refresh:** Remember to do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) on the frontend page to ensure you're not seeing cached content.

This comprehensive process allows you to systematically extend the CMS to manage various parts of your website. Remember to adapt collection names, document IDs, field names, and element IDs to match your specific requirements for each new page or section.

---
*This documentation is intended to guide non-technical users in managing website content. For more technical issues or Firebase-specific problems, further developer assistance or Firebase documentation review may be required.*
