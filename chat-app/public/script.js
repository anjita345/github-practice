// script.js - Join page script

const nameForm = document.getElementById('nameForm');
const nameInput = document.getElementById('nameInput');
const genderSelect = document.getElementById('genderSelect');

// Save name and gender then navigate to users page
nameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const gender = genderSelect.value;
  if (!name || !gender) {
    alert('Please enter your name and select a gender.');
    return;
  }
  // store in localStorage for users page
  localStorage.setItem('pc_name', name);
  localStorage.setItem('pc_gender', gender);
  window.location = '/users.html';
});
