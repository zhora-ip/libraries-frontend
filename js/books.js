document.addEventListener('DOMContentLoaded', function () {
    const booksForm = document.getElementById('books-form');
    const messageContainer = document.getElementById('message-container');

    if (booksForm) {
        const booksResults = document.getElementById('books-results');
        const booksTable = document.getElementById('books-table').getElementsByTagName('tbody')[0];
        const backwardButton = document.getElementById('backward-button');
        const forwardButton = document.getElementById('forward-button');

        let firstCursor = null;
        let lastCursor = null;
        const limit = 10;

        backwardButton.addEventListener('click', function () {
            getBooks(true, firstCursor);
        });

        forwardButton.addEventListener('click', function () {
            getBooks(false, lastCursor);
        });

        booksForm.addEventListener('submit', function (e) {
            e.preventDefault();
            firstCursor = null;
            lastCursor = null;
            getBooks(false, null);
        });

        async function getBooks(backward, cursor) {
            const token = localStorage.getItem('token');
            
            const formData = {
                cursor: cursor,
                limit: limit,
                backward: backward,
                id: parseInt(document.getElementById('id-filter').value) || null,
                title: document.getElementById('title-filter').value || null,
                author: document.getElementById('author-filter').value || null,
                genre: document.getElementById('genre-filter').value || null,
                age_limit: parseInt(document.getElementById('age-limit-filter').value) || null,
            };

            Object.keys(formData).forEach(
                (key) => (formData[key] === null || formData[key] === '') && delete formData[key]
            );

            try {
                console.log('Отправляем запрос на получение книг:', formData);
                
                const headers = {
                    'Content-Type': 'application/json',
                };
                
                if (token) {
                    headers['Authorization'] = 'Bearer ' + token;
                }
                
                const response = await fetch(`${API_BASE_URL}/books`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(formData)
                });

                console.log('Статус ответа:', response.status);

                if (!response.ok) {
                    if (response.status === 401 && token) {
                        localStorage.removeItem('token');
                        throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Ошибка получения списка книг');
                }

                if (response.status === 204 || response.headers.get('Content-Length') === '0') {
                    if (backward) {
                        showMessage(messageContainer, 'Вы уже на первой странице', true);
                    } else {
                        showMessage(messageContainer, 'Вы уже на последней странице', true);
                    }
                    return;
                }

                const data = await response.json();
                console.log('Получены данные книг:', data);
                
                updateBooks(data);
            } catch (error) {
                console.error('Ошибка при получении книг:', error);
                showMessage(messageContainer, error.message, true);
            }
        }

        function updateBooks(data) {
            console.log('Обновление отображения книг с данными:', data);
            showMessage(messageContainer, 'Книги успешно загружены');
            booksTable.innerHTML = '';
            
            let booksArray = data.books;
            console.log('Массив книг для отображения:', booksArray);
            
            if (booksArray && booksArray.length > 0) {
                firstCursor = data.first_cursor;
                lastCursor = data.last_cursor;

                booksArray.forEach((book) => {
                    console.log('Обработка книги:', book);
                    
                    const row = booksTable.insertRow();
                    row.setAttribute('data-id', book.id);
                    row.addEventListener('click', function() {
                        window.location.href = `book-details.html?id=${book.id}`;
                    });
                    
                    row.insertCell(0).textContent = book.id;
                    
                    const titleCell = row.insertCell(1);
                    const titleLink = document.createElement('a');
                    titleLink.href = `book-details.html?id=${book.id}`;
                    titleLink.textContent = book.title || 'Без названия';
                    titleLink.className = 'book-link';
                    titleLink.addEventListener('click', function(e) {
                        e.stopPropagation(); 
                    });
                    titleCell.appendChild(titleLink);
                    
                    row.insertCell(2).textContent = book.author || 'N/A';
                    row.insertCell(3).textContent = book.genre || 'N/A';
                    row.insertCell(4).textContent = book.age_limit !== undefined ? `${book.age_limit}+` : 'N/A';
                    row.insertCell(5).textContent = book.updated_at ? formatDate(book.updated_at) : 'N/A';
                });

                booksResults.classList.remove('hidden');
                backwardButton.classList.remove('hidden');
                forwardButton.classList.remove('hidden');
            } else {
                console.log('Нет книг для отображения');
                booksTable.innerHTML = '<tr><td colspan="6">Книги не найдены</td></tr>';
                backwardButton.classList.add('hidden');
                forwardButton.classList.add('hidden');
                booksResults.classList.remove('hidden');
            }
        }
        getBooks(false, null);
    }
});
