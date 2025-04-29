document.addEventListener('DOMContentLoaded', function() {

    const historyForm = document.getElementById('history-form');
    if (historyForm) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'signin.html';
            return;
        }
        
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('cursor').value = now.toISOString().slice(0, 16);
        
        initHistoryForm();
    }
});


function initHistoryForm() {
    const form = document.getElementById('history-form');
    const messageContainer = document.getElementById('message-container');
    const historyResults = document.getElementById('history-results');
    const historyTable = document.getElementById('history-table').getElementsByTagName('tbody')[0];
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const cursorDate = new Date(document.getElementById('cursor').value);
        const formData = {
            cursor: cursorDate.toISOString(),
            limit: parseInt(document.getElementById('limit').value),
            backward: document.getElementById('backward').value === 'true',
            phys_book_id: parseInt(document.getElementById('book-id').value)
        };
        
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage(messageContainer, 'Необходима авторизация. Перенаправление...', true);
            
            setTimeout(() => {
                window.location.href = 'signin.html';
            }, 2000);
            return;
        }
        
        fetch(`${API_BASE_URL}/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
                }
                return response.json().then(data => {
                    throw new Error(data.error || 'Ошибка получения истории');
                });
            }
            return response.json();
        })
        .then(data => {
            showMessage(messageContainer, 'Данные успешно получены');
            
            historyTable.innerHTML = '';
            
            if (data.data && data.data.length > 0) {
                data.data.forEach(item => {
                    const row = historyTable.insertRow();
                    
                    row.insertCell(0).textContent = item.ID;
                    row.insertCell(1).textContent = item.LibraryID;
                    row.insertCell(2).textContent = item.PhysicalBookID;
                    row.insertCell(3).textContent = item.UserID;
                    row.insertCell(4).textContent = getStatusText(item.Status);
                    row.insertCell(5).textContent = formatDate(item.CreatedAt);
                    row.insertCell(6).textContent = formatDate(item.ExpiresAt);
                });
                
                historyResults.classList.remove('hidden');
            } else {
                historyTable.innerHTML = '<tr><td colspan="7">Нет данных</td></tr>';
                historyResults.classList.remove('hidden');
            }
        })
        .catch(error => {
            showMessage(messageContainer, error.message, true);
            
            if (error.message.includes('Сессия истекла')) {
                setTimeout(() => {
                    window.location.href = 'signin.html';
                }, 2000);
            }
        });
    });
}