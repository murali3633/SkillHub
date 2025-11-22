// Test frontend-backend connection
console.log('Testing frontend-backend connection...');

// Test courses API
fetch('http://localhost:5000/api/courses')
  .then(response => {
    console.log('Courses API Response Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Courses API Success:', data.length > 0);
    console.log('Number of courses:', data.length);
    if (data.length > 0) {
      console.log('First course:', data[0].title);
    }
  })
  .catch(error => {
    console.log('Courses API Error:', error.message);
  });

// Test login API
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'student@example.com',
    password: 'password123'
  })
})
  .then(response => {
    console.log('Login API Response Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Login API Success:', data.success);
    if (data.success) {
      console.log('User logged in:', data.user.name);
      console.log('Token received:', !!data.token);
    } else {
      console.log('Login API Error:', data.message);
    }
  })
  .catch(error => {
    console.log('Login API Error:', error.message);
  });

console.log('Frontend-backend connection test initiated...');