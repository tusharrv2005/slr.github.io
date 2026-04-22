async function submitInquiry(event) {
  event.preventDefault();

  const form = event.target;
  const notice = document.getElementById('notice');

  const payload = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    section: form.section.value,
    message: form.message.value.trim()
  };

  try {
    const response = await fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Inquiry submit nahi ho payi.');
    }

    notice.className = 'notice success';
    notice.textContent = result.message;
    form.reset();
  } catch (error) {
    notice.className = 'notice error';
    notice.textContent = error.message;
  }
}
