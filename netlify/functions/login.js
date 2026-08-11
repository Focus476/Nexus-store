document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/.netlify/functions/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Login successful!');
            window.location.href = '/dashboard.html'; // Change to your destination page
        } else {
            alert(data.message || 'Login failed.');
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Server connection failed.');
    }
});
