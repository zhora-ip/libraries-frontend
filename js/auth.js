document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        initSignupForm();
    }

    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        initSigninForm();
    }
});


function initSignupForm() {
    const form = document.getElementById('signup-form');
    const messageContainer = document.getElementById('message-container');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            login: document.getElementById('login').value,
            password: document.getElementById('password').value,
            email: document.getElementById('email').value,
            phone_number: document.getElementById('phone').value,
            full_name: document.getElementById('fullname').value,
            role: parseInt(document.getElementById('role').value)
        };
        
        fetch(`${API_BASE_URL}/sign-up`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Ошибка регистрации');
                });
            }
            return response.json();
        })
        .then(data => {
            showMessage(messageContainer, `Регистрация успешна! ID пользователя: ${data.id}`);
            form.reset();
        })
        .catch(error => {
            showMessage(messageContainer, error.message, true);
        });
    });
}


function initSigninForm() {
    const form = document.getElementById('signin-form');
    const messageContainer = document.getElementById('message-container');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            login: document.getElementById('login').value,
            password: document.getElementById('password').value
        };
        
        fetch(`${API_BASE_URL}/sign-in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Ошибка входа');
                });
            }
            return response.json();
        })
        .then(data => {
            localStorage.setItem('token', data.token);
            
            showMessage(messageContainer, 'Вход успешен! Перенаправление...');
            
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
        })
        .catch(error => {
            showMessage(messageContainer, error.message, true);
        });
    });
}
