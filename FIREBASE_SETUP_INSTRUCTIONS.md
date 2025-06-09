# Firebase Setup Instructions for Apollo Knowledge Website Admin Panel

This document provides instructions on how to set up Firebase for the Apollo Knowledge website's admin panel functionality.

## 1. Create a Firebase Project

If you haven't already, create a new Firebase project:

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click on "Add project" and follow the on-screen instructions.
3.  Once your project is created, you will be redirected to the project overview page.

## 2. Obtain Firebase Configuration

1.  In your Firebase project console, click on the "Project settings" gear icon (⚙️) next to "Project Overview".
2.  Under the "General" tab, scroll down to the "Your apps" section.
3.  Click on the web icon (`</>`) to register a new web app.
4.  Give your app a nickname (e.g., "Apollo Knowledge Web").
5.  Click "Register app".
6.  Firebase will provide you with a `firebaseConfig` object. This object contains your project's specific credentials.
    ```javascript
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };
    ```
7.  **Important:** Copy this `firebaseConfig` object.

## 3. Update `firebase-config.js`

1.  Open the file `frontend/scripts/firebase-config.js` in your project.
2.  Replace the placeholder `firebaseConfig` object with the one you copied from your Firebase project console.

    ```javascript
    // ... other comments ...

    // TODO: Replace with your actual Firebase project configuration object
    const firebaseConfig = { // PASTE YOUR COPIED CONFIG HERE
      apiKey: "YOUR_API_KEY", // Replace with your actual apiKey
      authDomain: "YOUR_AUTH_DOMAIN", // Replace with your actual authDomain
      projectId: "YOUR_PROJECT_ID", // Replace with your actual projectId
      storageBucket: "YOUR_STORAGE_BUCKET", // Replace with your actual storageBucket
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your actual messagingSenderId
      appId: "YOUR_APP_ID" // Replace with your actual appId
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // ... rest of the file ...
    ```

## 4. Enable Email/Password Authentication

For the admin panel to work, you need to enable Email/Password authentication in Firebase:

1.  In the Firebase Console, navigate to "Authentication" from the left-hand menu (under Build).
2.  Go to the "Sign-in method" tab.
3.  Find "Email/Password" in the list of providers and click the pencil icon to edit it.
4.  Enable the provider and click "Save".

## 5. Deploy Firestore Rules

The project includes a `firestore.rules` file that defines basic security rules for your Firestore database. You need to deploy these rules:

1.  **Install Firebase CLI:** If you don't have it installed, follow the instructions [here](https://firebase.google.com/docs/cli#setup_login_and_test) to install the Firebase CLI.
2.  **Login to Firebase:** Open your terminal or command prompt and run `firebase login`.
3.  **Navigate to your project directory:** `cd /path/to/your/apollo-knowledge-project` (this should be the root directory where `firebase.json` and `firestore.rules` are located, or will be if you initialize Firebase for hosting/deployment).
4.  **Initialize Firebase (if not already done for hosting):** If this is the first time you're deploying from this project directory, you might need to run `firebase init firestore`. Select your project and follow the prompts. Make sure it points to the `firestore.rules` file.
5.  **Deploy Firestore Rules:** Run the following command in your terminal:
    ```bash
    firebase deploy --only firestore:rules
    ```
    This command will upload and activate the rules defined in `firestore.rules` to your Firebase project.

## 6. HTML Integration (Already Done in Code)

The necessary Firebase SDK scripts and the `firebase-config.js` file have already been added to `index.html` and `frontend/programs.html`. You generally don't need to change this unless you are restructuring the project or adding Firebase to more HTML files.

The scripts are included in the `<head>` section as follows:

```html
<!-- Firebase App (the core Firebase SDK) is always required and must be listed first -->
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>

<!-- Add SDKs for Firebase products that you want to use for the CMS -->
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
<!-- Note: firebase-storage.js is not required for the CMS image handling if using external URLs. -->
<!-- Include it only if you have other features that require Firebase Storage. -->
<!-- <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-storage.js"></script> -->

<!-- Your Firebase Configuration -->
<script src="frontend/scripts/firebase-config.js"></script>
```

After completing these steps, your Apollo Knowledge website will be configured to use Firebase for its admin panel features (Authentication and Firestore database). Remember to keep your `firebaseConfig` details secure and do not commit them to public repositories if the keys are sensitive (though for client-side apps, these are generally considered public but protected by Firebase rules).

## 7. Deploying to Firebase Hosting

Once your Firebase project is set up, your `firebase-config.js` is updated, and you have admin users created, you need to deploy your website to Firebase Hosting.

1.  **Install Firebase CLI (if not already done):**
    ```bash
    npm install -g firebase-tools
    ```
    or follow the official guide.
2.  **Login to Firebase:**
    ```bash
    firebase login
    ```
3.  **Initialize Firebase Hosting (if this is the first deployment for this project directory):**
    Run `firebase init hosting` in your project's root directory.
    *   Select "Use an existing project" and choose the Firebase project you set up.
    *   Specify your public directory (usually `.` if your `index.html` is in the root, or a subfolder like `public` or `dist` depending on your project structure. For this project, if `index.html` is at the root, `.` or leaving it blank might be appropriate, but ensure it points to where your `index.html` and other assets are).
    *   Configure as a single-page app (SPA): Choose "No" unless your site is specifically built as an SPA that requires all URLs to route to `index.html`. For this project, "No" is likely appropriate.
    *   Set up automatic builds and deploys with GitHub: Choose "No" for now, unless you intend to set this up.
4.  **Deploy:**
    To deploy your website, run the following command from your project's root directory:
    ```bash
    firebase deploy
    ```
    Alternatively, if you only want to deploy hosting changes:
    ```bash
    firebase deploy --only hosting
    ```

This will upload your website files to Firebase Hosting, making your site and the admin panel accessible via the URLs provided by Firebase (e.g., `your-project-id.web.app` and `your-project-id.firebaseapp.com`).
