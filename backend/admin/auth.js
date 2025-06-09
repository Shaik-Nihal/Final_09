document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase is initialized (it should be by firebase-config.js)
    if (typeof firebase === 'undefined' || typeof firebase.auth === 'undefined') {
        console.error("Firebase not initialized. Make sure firebase-config.js is loaded before this script.");
        alert("Firebase not initialized. Admin panel cannot function.");
        return;
    }

    const auth = firebase.auth();
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            if (loginError) loginError.textContent = ''; // Clear previous errors

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Signed in 
                    console.log("Admin user signed in:", userCredential.user);
                    window.location.href = 'dashboard.html';
                })
                .catch((error) => {
                    console.error("Login failed:", error);
                    if (loginError) {
                        loginError.textContent = error.message;
                    } else {
                        alert("Login failed: " + error.message);
                    }
                });
        });
    }

    // Auth State Listener
    // Redirect to dashboard if user is already logged in and on the login page
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in.
            console.log("Auth state changed: User is logged in", user.email);
            // Check if we are on the login page (index.html)
            if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/admin/') || window.location.pathname.endsWith('/admin')) {
                console.log("User is logged in and on login page, redirecting to dashboard.html");
                window.location.href = 'dashboard.html';
            }
        } else {
            // User is signed out.
            console.log("Auth state changed: User is signed out.");
        }
    });

});
