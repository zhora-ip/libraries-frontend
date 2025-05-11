document.addEventListener('DOMContentLoaded', function () {
    const messageContainer = document.getElementById('message-container');
    const bookLoading = document.getElementById('book-loading');
    const bookDetails = document.getElementById('book-details');
    
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    
    let map = null;
    let markers = [];
    let selectedLibrary = null;

    if (!bookId) {
        showMessage(messageContainer, 'ID книги не указан', true);
        bookLoading.textContent = 'Не удалось загрузить информацию о книге: ID не указан';
        return;
    }

    getBookDetails(bookId);
    
    async function getBookDetails(id) {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }
            
            const response = await fetch(`${API_BASE_URL}/books/${id}`, {
                method: 'GET',
                headers: headers
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Книга не найдена');
                } else if (response.status === 401 && token) {
                    localStorage.removeItem('token');
                    throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Ошибка получения информации о книге');
                }
            }
            
            const bookData = await response.json();
            console.log('Результат запроса:', bookData);
            
            displayBookDetails(bookData.books[0]);
        } catch (error) {
            console.error('Ошибка при получении информации о книге:', error);
            showMessage(messageContainer, error.message, true);
            bookLoading.textContent = `Не удалось загрузить информацию о книге: ${error.message}`;
        }
    }
    
    function displayBookDetails(book) {   
        console.log('Книга:', book);   

        document.title = `${book.title || 'Книга'} - Система управления библиотекой`;
        
        const ageLimitBadge = book.age_imit ? 
            `<span class="badge ${book.age_limit >= 18 ? 'badge-danger' : (book.age_limit >= 12 ? 'badge-warning' : '')}">${book.age_limit}+</span>` : '';
        
        const html = `
            <div class="book-header">
                <div>
                    <h2 class="book-title">${book.title || 'Без названия'} ${ageLimitBadge}</h2>
                    <p class="book-author">${book.author || 'Автор не указан'}</p>
                </div>
                <div>
                    <p>ID: ${book.id}</p>
                    <p>Обновлено: ${formatDate(book.updated_at)}</p>
                </div>
            </div>
            
            <div class="book-meta">
                <div class="book-meta-item">
                    <span class="meta-label">Жанр:</span>
                    <span class="meta-value">${book.genre || 'Не указан'}</span>
                </div>
                <div class="book-meta-item">
                    <span class="meta-label">Год издания:</span>
                    <span class="meta-value">${book.PublicationYear || 'Не указан'}</span>
                </div>
                <div class="book-meta-item">
                    <span class="meta-label">Издательство:</span>
                    <span class="meta-value">${book.Publisher || 'Не указано'}</span>
                </div>
                <div class="book-meta-item">
                    <span class="meta-label">ISBN:</span>
                    <span class="meta-value">${book.ISBN || 'Не указан'}</span>
                </div>
            </div>
            
            <h3 class="book-section-title">Описание</h3>
            <div class="book-description">
                ${book.description || 'Описание отсутствует'}
            </div>

            <h3 class="book-section-title">Наличие экземпляров</h3>
            <div class="map-content">
                <div id="map"></div>
                <div id="library-info">
                    <div class="placeholder">Выберите библиотеку на карте</div>
                </div>
            </div>
        `;
        
        bookDetails.innerHTML = html;
        bookLoading.classList.add('hidden');
        bookDetails.classList.remove('hidden');

        initMap();
        fetchLibraryData(book.id);
    }

    function initMap() {
        try {
            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                console.error('Map container not found');
                return;
            }
            
            map = L.map('map').setView([55.75, 37.6], 10);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            
            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    function fetchLibraryData(bookId) {
        const token = localStorage.getItem('token');
        const libraryInfo = document.getElementById('library-info');
        
        if (!map || !libraryInfo) {
            console.error('Map or library info container not found');
            return;
        }
        
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        
        libraryInfo.innerHTML = '<div class="loading">Загрузка данных...</div>';
        
        fetch(`${API_BASE_URL}/physbooks?book_id=${bookId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
                }
                throw new Error('Данные не найдены');
            }
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                libraryInfo.innerHTML = '<div class="placeholder">Нет данных о библиотеках с этой книгой</div>';
                return;
            }
            
            const bounds = [];
            
            data.forEach(item => {
                const { library } = item;
                const marker = L.marker([library.Lat, library.Lng]).addTo(map);
                
                marker.bindPopup(`
                    <b>${library.Name}</b><br>
                    ${library.Address}<br>
                    Доступно книг: ${item.amount}
                `);
                
                marker.on('click', function() {
                    showLibraryInfo(item);
                });
                
                markers.push(marker);
                bounds.push([library.Lat, library.Lng]);
            });
            
            if (bounds.length > 0) {
                map.fitBounds(bounds);
            }
            
            libraryInfo.innerHTML = '<div class="placeholder">Выберите библиотеку на карте</div>';
        })
        .catch(error => {
            libraryInfo.innerHTML = `<div class="error">${error.message}</div>`;
            console.error('Ошибка при получении данных о библиотеках:', error);
        });
    }
    
    function showLibraryInfo(libraryData) {
        selectedLibrary = libraryData;
        const { library, phys_book_ids, amount } = libraryData;
        const libraryInfo = document.getElementById('library-info');
        
        let physBooksHtml = '';
        phys_book_ids.forEach(id => {
            physBooksHtml += `<span class="phys-book-id">${id}</span>`;
        });
        
        libraryInfo.innerHTML = `
            <h2>${library.Name}</h2>
            
            <div class="info-group">
                <h3>Адрес</h3>
                <p>${library.Address}</p>
            </div>
            
            <div class="info-group">
                <h3>Телефон</h3>
                <p>${library.PhoneNumber}</p>
            </div>
            
            <div class="info-group">
                <h3>Координаты</h3>
                <p>Широта: ${library.Lat}, Долгота: ${library.Lng}</p>
            </div>
            
            <div class="info-group">
                <h3>Доступность книги</h3>
                <p class="book-amount">${amount} экземпляров</p>
                
                <div class="phys-books">
                    <h4>ID физических книг:</h4>
                    <div class="phys-book-ids">${physBooksHtml}</div>
                </div>
                ${phys_book_ids.length > 0 ? 
                    `<div class="order-book">
                        <button id="order-button" class="btn btn-primary">Забронировать</button>
                        <div id="order-message"></div>
                    </div>` : ''
                }
            </div>
            
            <div class="info-group">
                <h3>Информация о библиотеке добавлена</h3>
                <p>${formatDate(library.CreatedAt)}</p>
            </div>


        `;

        const orderButton = document.getElementById('order-button');
        if (orderButton) {
            orderButton.addEventListener('click', function() {
                orderBook(phys_book_ids[0]);
            });
        }
    }

    async function orderBook(physBookId) {
        const token = localStorage.getItem('token');
        const orderMessage = document.getElementById('order-message');
        
        if (!token) {
            window.location.href = 'signin.html';
            return;
        }
        
        orderMessage.innerHTML = '<div class="loading">Отправка запроса на бронирование...</div>';
        
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    phys_book_id: physBookId
                })
            });
            
            if (response.status === 200) {
                orderMessage.innerHTML = `
                    <div class="success-message">
                        Книга успешно забронирована! Номер бронирования: ${physBookId}
                    </div>
                `;
                
                const bookId = urlParams.get('id');
                if (bookId) {
                    fetchLibraryData(bookId);
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при бронировании книги');
            }
        } catch (error) {
            console.error('Ошибка при бронировании книги:', error);
            orderMessage.innerHTML = `
                <div class="error-message">
                    ${error.message || 'Ошибка при бронировании книги'}
                </div>
            `;
        }
    }
});


