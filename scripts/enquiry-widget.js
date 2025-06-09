document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("enquiry-form");
  
    form.addEventListener("submit", function (e) {
      e.preventDefault();
  
      // Basic validation (you can expand this if needed)
      const requiredFields = ["name", "phone", "email", "program", "city", "consent"];
      for (let fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (field.type === "checkbox" && !field.checked) {
          alert("Please agree to the privacy policy.");
          field.focus();
          return;
        } else if (!field.value || field.value.trim() === "") {
          alert("Please fill in all required fields.");
          field.focus();
          return;
        }
      }
  
      // Prepare data for API
      const formData = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        program: form.program.value,
        city: form.city.value,
        message: form.message.value.trim(),
        howHeard: form["how-heard"].value,
        consent: form.consent.checked,
      };
  
      console.log("Submitting form data:", formData); // Debug
  
      // Simulate submission (you can integrate your API here)
      // For real API: replace with `fetch('https://api.url', {...})`
      setTimeout(() => {
        alert("Thank you! Your enquiry has been submitted.");
        form.reset();
      }, 500);
    });
  });
  