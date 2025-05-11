document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const messageContainer = document.getElementById('message-container');
    
    if (!token) {
        window.location.href = 'signin.html';
        return;
    }
    
    const profileData = document.getElementById('profile-data');
    const profileEdit = document.getElementById('profile-edit');
    const editProfileBtn = document.getElementById('edit-profile');
    const deleteProfileBtn = document.getElementById('delete-profile');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const profileForm = document.getElementById('profile-form');
    
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    
    let userData = {};
    
    getUserData();
    
    async function getUserData() {
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
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = 'signin.html';
                    return;
                }
                throw new Error('Ошибка получения данных профиля');
            }
            
            userData = await response.json();
            console.log('Полученные данные профиля:', userData);
            displayUserData(userData);
        } catch (error) {
            showMessage(messageContainer, error.message, true);
        }
    }
    
    
    function displayUserData(user) {
        const roleText = getRoleText(user.role);
        const roleBadgeClass = getRoleBadgeClass(user.role);
        
        const html = `
            <div class="profile-row">
                <span class="profile-label">Логин:</span>
                <span class="profile-value">${user.login || '-'}</span>
            </div>
            <div class="profile-row">
                <span class="profile-label">Полное имя:</span>
                <span class="profile-value">${user.full_name || '-'}</span>
            </div>
            <div class="profile-row">
                <span class="profile-label">Телефон:</span>
                <span class="profile-value">${user.phone_number || '-'}</span>
            </div>
            <div class="profile-row">
                <span class="profile-label">Email:</span>
                <span class="profile-value">${user.email || '-'}</span>
            </div>
            <div class="profile-row">
                <span class="profile-label">Роль:</span>
                <span class="profile-value">
                    <span class="role-badge ${roleBadgeClass}">${roleText}</span>
                </span>
            </div>
            <div class="profile-row">
                <span class="profile-label">Читательский билет:</span>
                <span class="profile-value">${user.lib_card || '-'}</span>
            </div>
            <div class="profile-row">
                <span class="profile-label">Действителен до:</span>
                <span class="profile-value">${user.expires_at ? formatDate(user.expires_at) : '-'}</span>
            </div>
        `;
        
        profileData.innerHTML = html;
        
        document.getElementById('login-input').value = user.login || '';
        document.getElementById('full-name-input').value = user.full_name || '';
        document.getElementById('phone-input').value = user.phone_number || '';
        document.getElementById('email-input').value = user.email || '';
    }
    
    editProfileBtn.addEventListener('click', function() {
        profileData.classList.add('hidden');
        profileEdit.classList.remove('hidden');
        editProfileBtn.classList.add('hidden');
        deleteProfileBtn.classList.add('hidden');
    });
    
    cancelEditBtn.addEventListener('click', function() {
        profileData.classList.remove('hidden');
        profileEdit.classList.add('hidden');
        editProfileBtn.classList.remove('hidden');
        deleteProfileBtn.classList.remove('hidden');
    });
    

    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {};
        const login = document.getElementById('login-input').value.trim();
        const password = document.getElementById('password-input').value.trim();
        const fullName = document.getElementById('full-name-input').value.trim();
        const phone = document.getElementById('phone-input').value.trim();
        const email = document.getElementById('email-input').value.trim();
        

        if (login && login !== (userData.login || '')) {
            formData.login = login;
        }

        if (password) {
            formData.password = password;
        }
        
        if (fullName !== (userData.full_name || '')) {
            formData.full_name = fullName;
        }
        
        if (phone !== (userData.phone_number || '')) {
            formData.phone_number = phone;
        }
        
        if (email !== (userData.email || '')) {
            formData.email = email;
        }
        
        console.log('Исходные данные:', userData);
        console.log('Данные формы:', { login, fullName, phone, email });
        console.log('Данные для отправки:', formData);

        if (Object.keys(formData).length > 0) {
            try {
                const response = await fetch(`${API_BASE_URL}/user`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(formData)
                });
                
                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.removeItem('token');
                        window.location.href = 'signin.html';
                        return;
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Ошибка обновления профиля');
                }
                
                showMessage(messageContainer, 'Профиль успешно обновлен');
                
                getUserData();
                

                profileData.classList.remove('hidden');
                profileEdit.classList.add('hidden');
                editProfileBtn.classList.remove('hidden');
                deleteProfileBtn.classList.remove('hidden');
                
                document.getElementById('password-input').value = '';
            } catch (error) {
                showMessage(messageContainer, error.message, true);
            }
        } else {
            profileData.classList.remove('hidden');
            profileEdit.classList.add('hidden');
            editProfileBtn.classList.remove('hidden');
            deleteProfileBtn.classList.remove('hidden');
        }
    });
    
    deleteProfileBtn.addEventListener('click', function() {
        deleteModal.style.display = 'block';
    });

    cancelDeleteBtn.addEventListener('click', function() {
        deleteModal.style.display = 'none';
    });
    
    confirmDeleteBtn.addEventListener('click', async function() {
        try {
            const response = await fetch(`${API_BASE_URL}/user`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка удаления профиля');
            }
            
            localStorage.removeItem('token');
            window.location.href = '../index.html';
        } catch (error) {
            deleteModal.style.display = 'none';
            showMessage(messageContainer, error.message, true);
        }
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
    
    function getRoleText(role) {
        switch(role) {
            case 'ADMIN': return 'Администратор';
            case 'LIBRARIAN': return 'Библиотекарь';
            case 'READER': return 'Читатель';
            default: return 'Неизвестная роль';
        }
    }
    
    function getRoleBadgeClass(role) {
        switch(role) {
            case 'ADMIN': return 'role-admin';
            case 'LIBRARIAN': return 'role-librarian';
            case 'READER': return 'role-reader';
            default: return 'role-unknown';
        }
    }
});
