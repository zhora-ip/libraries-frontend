document.addEventListener('DOMContentLoaded', function () {
    const userRole = localStorage.getItem('role');
    const historyForm = document.getElementById('history-form');
    const messageContainer = document.getElementById('message-container');


    if (historyForm) {
        if (!(userRole === 'ADMIN' || userRole === 'LIBRARIAN')) {
            historyForm.style.display = 'none';
        }

        const token = localStorage.getItem('token');

        if (!token) {
            window.location.href = 'signin.html';
            return;
        }

        const historyResults = document.getElementById('history-results');
        const historyTable = document.getElementById('history-table').getElementsByTagName('tbody')[0];
        const backwardButton = document.getElementById('backward-button');
        const forwardButton = document.getElementById('forward-button');

        let firstCursor = null;
        let lastCursor = null;
        const limit = 5;

        backwardButton.addEventListener('click', function () {
            getHistory(true, firstCursor); 
        });

        forwardButton.addEventListener('click', function () {
            getHistory(false, lastCursor); 
        });

        historyForm.addEventListener('submit', function (e) {
            e.preventDefault();
            firstCursor = null;
            lastCursor = null;
            getHistory(false, null);
        });

        async function getHistory(backward, cursor) {
            const token = localStorage.getItem('token');

            if (!token) {
                showMessage(messageContainer, 'Необходима авторизация. Перенаправление...', true);
                setTimeout(() => {
                    window.location.href = 'signin.html';
                }, 2000);
                return;
            }
            const formData = {
                cursor: cursor,
                limit: limit,
                backward: backward,
                id: parseInt(document.getElementById('id-filter').value) || null,
                occurrence_id: parseInt(document.getElementById('occurrence-id-filter').value) || null,
                user_id: parseInt(document.getElementById('user-id-filter').value) || null,
                library_id: parseInt(document.getElementById('library-id-filter').value) || null,
                phys_book_id: parseInt(document.getElementById('book-id-filter').value) || null,
            };

            Object.keys(formData).forEach(
                (key) => (formData[key] === null || formData[key] === undefined) && delete formData[key]
            );

            try {
                const response = await fetch(`${API_BASE_URL}/history`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + token,
                    },
                    body: JSON.stringify(formData),
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.removeItem('token');
                        throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Ошибка получения истории');
                }
                
                if (response.status === 204 || response.headers.get('Content-Length') === '0') {
                    if (backward) {
                        showMessage('Вы уже на первой странице', true);
                    } else {
                        showMessage('Вы уже на последней странице', true);
                    }
                    return;
                }

                const data = await response.json();
                updateHistory(data);
            } catch (error) {
                showMessage(messageContainer, error.message, true);
            }
        }      

        function createIssueButton(orderId) {
            const button = document.createElement('button');
            button.textContent = 'Выдать';
            button.classList.add('btn', 'btn-primary');
            button.addEventListener('click', async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${API_BASE_URL}/issue`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ id: orderId })
                    });
                    
                    if (!response.ok) throw new Error('Ошибка при выдаче книги');
                    
                    alert('Книга успешно выдана');
                    getHistory(false, null);
                } catch (error) {
                    alert(error.message);
                }
            });
            return button;
        }

        function createReturnButton(orderId) {
            const button = document.createElement('button');
            button.textContent = 'Вернуть';
            button.classList.add('btn', 'btn-primary');
            button.addEventListener('click', async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${API_BASE_URL}/return`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ id: orderId })
                    });
                    
                    if (!response.ok) throw new Error('Ошибка при возврате книги');
                    
                    alert('Книга успешно возвращена');
                    getHistory(false, null);
                } catch (error) {
                    alert(error.message);
                }
            });
            return button;
        }


        function createAcceptButton(orderId) {
            const button = document.createElement('button');
            button.textContent = 'Принять';
            button.classList.add('btn', 'btn-primary');
            button.addEventListener('click', async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${API_BASE_URL}/accept`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ id: orderId })
                    });
                    
                    if (!response.ok) throw new Error('Ошибка при принятии книг');
                    
                    alert('Книга успешно принята');
                    getHistory(false, null);
                } catch (error) {
                    alert(error.message);
                }
            });
            return button;
        }


        function updateHistory(data) {
            showMessage(messageContainer, 'История успешно загружена');
            historyTable.innerHTML = '';
            console.log('Массив заказов для отображения:', data.orders);

            if (data.orders && data.orders.length > 0) {
                firstCursor = data.first_cursor;
                lastCursor = data.last_cursor;

                data.orders.forEach((item) => {
                    const row = historyTable.insertRow();

                    row.insertCell(0).textContent = item.ID;
                    row.insertCell(1).textContent = item.LibraryID;
                    row.insertCell(2).textContent = item.PhysicalBookID;
                    row.insertCell(3).textContent = item.UserID;
                    row.insertCell(4).textContent = getStatusText(item.Status);
                    row.insertCell(5).textContent = formatDate(item.CreatedAt);
                    row.insertCell(6).textContent = formatDate(item.ExpiresAt);

                    const actionCell = row.insertCell(-1);
                    if ((userRole === 'ADMIN' || userRole === 'LIBRARIAN') && item.Status === 1) {
                        actionCell.appendChild(createIssueButton(item.ID));
                    }
                    
                    if (userRole === 'READER' && item.Status === 3) {
                        actionCell.appendChild(createReturnButton(item.ID));
                    }
                    
                    if ((userRole === 'ADMIN' || userRole === 'LIBRARIAN') && item.Status === 5) {
                        actionCell.appendChild(createAcceptButton(item.ID));
                    }
                });

                historyResults.classList.remove('hidden');
                backwardButton.classList.remove('hidden');
                forwardButton.classList.remove('hidden');
            } else {
                historyTable.innerHTML = '<tr><td colspan="7">Нет данных</td></tr>';
                backwardButton.classList.add('hidden');
                forwardButton.classList.add('hidden');
                historyResults.classList.remove('hidden');
            }
        }

        getHistory(false, null);
    }
});

