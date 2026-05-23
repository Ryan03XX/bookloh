document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('bookingForm');
    const formMessage = document.getElementById('formMessage');

    // Only proceed if the form exists on the page
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm()) {
                submitFormAjax();
            }
        });

    function validateForm() {
        let isValid = true;
        const inputs = form.querySelectorAll('[data-validation]');
        
        inputs.forEach(input => {
            const validations = input.dataset.validation.split(' ');
            validations.forEach(validation => {
                switch(validation) {
                    case 'required':
                        if (!input.value.trim()) {
                            showError(input, 'This field is required');
                            isValid = false;
                        }
                        break;
                    case 'email':
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
                            showError(input, 'Please enter a valid email address');
                            isValid = false;
                        }
                        break;
                    case 'date':
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(input.value)) {
                            showError(input, 'Please enter a valid date (YYYY-MM-DD)');
                            isValid = false;
                        }
                        break;
                    case 'time':
                        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(input.value)) {
                            showError(input, 'Please enter a valid time (HH:MM)');
                            isValid = false;
                        }
                        break;
                }
            });
        });

        return isValid;
    }

    function showError(input, message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        input.parentNode.insertBefore(errorElement, input.nextSibling);
    }

    function submitFormAjax() {
        const formData = new FormData(form);
        
        fetch(form.action, {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            formMessage.innerHTML = data;
            if (data.includes('Thank you for your booking')) {
                form.reset();
            }
        })
        .catch(error => {
            formMessage.innerHTML = 'An error occurred. Please try again later.';
            console.error('Error:', error);
        });
    }
    }
});