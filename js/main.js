document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const historyLink = document.getElementById('history-link');
    const mapLink = document.getElementById('map-link');
    const logoutLink = document.getElementById('logout-link');
    
    if (token) {
        if (historyLink) historyLink.classList.remove('hidden');
        if (mapLink) mapLink.classList.remove('hidden');
        if (logoutLink) logoutLink.classList.remove('hidden');
    } else {
        if (historyLink) historyLink.classList.add('hidden');
        if (mapLink) mapLink.classList.add('hidden');
        if (logoutLink) logoutLink.classList.add('hidden');
        
        if (window.location.href.includes('history.html')) {
            window.location.href = 'signin.html';
        }
    }


    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = window.location.href.includes('/pages/') 
                ? '../index.html' 
                : 'index.html';
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
        default: return 'Неизвестно';
    }
}

const API_BASE_URL = 'https://localhost:8001';

function showMessage(container, message, isError = false) {
    container.innerHTML = `
        <div class="message ${isError ? 'error' : 'success'}">
            ${message}
        </div>
    `;
}
