document.querySelector('#appointmentDate').addEventListener('change', async function () {
    const date = this.value;
    const res = await fetch(`/citas/available-hours/${date}`);
    const data = await res.json();

    const hours = data.availableHours.map((hour) => hour.split(' '));


    const select = document.querySelector('#timeSelect');
    
    select.innerHTML = '';

    hours.forEach((hour) => {
      const option = document.createElement('option');
      option.value = hour;
      option.textContent = hour;
      select.appendChild(option);
    })

    
  });