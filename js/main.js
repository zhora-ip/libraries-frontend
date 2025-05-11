const API_BASE_URL = 'https://localhost:8001';

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');

    const signupBlock = document.getElementById('signup-block');
    const signinBlock = document.getElementById('signin-block');
    const logoutBlock = document.getElementById('logout-block');
    const profileLink = document.getElementById('profile-link');

    const allGridItems = document.querySelectorAll('.grid-item');

    function hideAllBlocks() {
        allGridItems.forEach(item => item.classList.add('hidden'));
    }


    function showBlocksByRole(role) {

        hideAllBlocks();

        if (role === 'GUEST') {
            if (signinBlock) signinBlock.classList.remove('hidden');
            if (signupBlock) signupBlock.classList.remove('hidden');
            if (profileLink) profileLink.classList.add('hidden');
            if (logoutBlock) logoutBlock.classList.add('hidden');
        } else {
            if (profileLink) profileLink.classList.remove('hidden');
            if (logoutBlock) logoutBlock.classList.remove('hidden');

            allGridItems.forEach(item => {
                const dataRole = item.getAttribute('data-role');
                if (!dataRole) return;

                if (dataRole === 'ALL' || dataRole === 'ALL_AUTH') {
                    item.classList.remove('hidden');
                } else if (dataRole === 'ADMIN' && role === 'ADMIN') {
                    item.classList.remove('hidden');
                }
            });
        }
    }

    if (!token) {
        showBlocksByRole('GUEST');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/user`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка при получении данных пользователя');
        }

        const data = await response.json();
        let role = data.role || 'UNKNOWN';

        if (!['ADMIN', 'LIBRARIAN', 'READER'].includes(role)) {
            role = 'READER';
        }

        localStorage.setItem('role', role);
        showBlocksByRole(role);

    } catch (error) {
        console.error('Ошибка при проверке роли:', error);
        showBlocksByRole('READER');
    }

    if (logoutBlock) {
        logoutBlock.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = '../index.html';
        });
    }
});


function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}
    
function getStatusText(status) {
    switch(status) {
    case 0: return 'Неизвестно';
    case 1: return 'Доступен';
    case 2: return 'Просрочен';
    case 3: return 'Выдан';
    case 4: return 'Отменен';
    case 5: return 'Возвращен';
    case 6: return 'Принят';
    default: return 'Неизвестно';
    }
}

function showMessage(container, message, isError = false) {
    container.innerHTML = `
    <div class="message ${isError ? 'error' : 'success'}">
    ${message}
    </div>
    `;
}

function checkAuth() {
    const token = localStorage.getItem('token');
    const profileLink = document.getElementById('profile-link');
    const historyLink = document.getElementById('history-link');
    const logoutLink = document.getElementById('logout-link');
    const signinLinks = document.querySelectorAll('a[href="signin.html"]');
    const signupLinks = document.querySelectorAll('a[href="signup.html"]');
    
    if (token) {
    
    if (profileLink) profileLink.classList.remove('hidden');
    if (historyLink) historyLink.classList.remove('hidden');
    if (logoutLink) logoutLink.classList.remove('hidden');
    
    signinLinks.forEach(link => link.classList.add('hidden'));
    signupLinks.forEach(link => link.classList.add('hidden'));
    
    if (logoutLink) {
    logoutLink.addEventListener('click', function(e) {
    e.preventDefault();
    logout();
    });
    }
    } else {
    if (profileLink) profileLink.classList.add('hidden');
    if (historyLink) historyLink.classList.add('hidden');
    if (logoutLink) logoutLink.classList.add('hidden');
    
    signinLinks.forEach(link => link.classList.remove('hidden'));
    signupLinks.forEach(link => link.classList.remove('hidden'));
    }
    }
    
    function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = 'index.html';
    }
    
    document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});