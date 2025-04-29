document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'signin.html';
        return;
    }

    const map = L.map('map').setView([55.75, 37.6], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const bookSearchForm = document.getElementById('book-search-form');
    const bookIdInput = document.getElementById('book-id');
    const libraryInfo = document.getElementById('library-info');
    
    let markers = [];
    let selectedLibrary = null;
    
    bookSearchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const bookId = bookIdInput.value;
        fetchLibraryData(bookId);
    });

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    function fetchLibraryData(bookId) {
        const token = localStorage.getItem('token');
        
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
                    window.location.href = 'signin.html';
                    throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
                }
                throw new Error('Ошибка получения данных о библиотеках');
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
        });
    }

    function showLibraryInfo(libraryData) {
        selectedLibrary = libraryData;
        const { library, phys_book_ids, amount } = libraryData;
        
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
            </div>
            
            <div class="info-group">
                <h3>Информация о библиотеке добавлена</h3>
                <p>${formatDate(library.CreatedAt)}</p>
            </div>
        `;
    }

    // Загрузить данные при инициализации
    fetchLibraryData(bookIdInput.value);
});
