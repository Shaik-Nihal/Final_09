// This script handles the WhatsApp modal functionality
function toggleWhatsAppModal() {
  document.getElementById("wa-modal").classList.toggle("active");
  document.getElementById("overlay").classList.toggle("active");
}

function closeAllModals() {
  document.getElementById("wa-modal").classList.remove("active");
  document.getElementById("overlay").classList.remove("active");
}

function sendWhatsAppMessage() {
  const program = document.getElementById('wa-program-select').value;
  const phoneNumber = '+917989039796'; // Replace with your WhatsApp number

  if (!program) {
    alert("Please select a program.");
    return;
  }

  const message = encodeURIComponent(`Hi! I want to enquire on ${program}`);
  const url = `https://wa.me/${phoneNumber}?text=${message}`;
  window.open(url, '_blank');
  closeAllModals();
}