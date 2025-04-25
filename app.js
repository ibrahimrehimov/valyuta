function toggleMenu() {
    const nav = document.querySelector('nav');
    nav.classList.toggle('active');
  }
  
  let fromCurr = "RUB";
  let toCurr = "USD";
  let rates = {};
  let isTyping = false;
  let activeField = 'from';
  
  const fromInput = document.querySelector('.input-currency');
  const toInput = document.querySelector('.output-currency');
  const fromBtns = document.querySelectorAll('.converter .box:first-child .tabs button');
  const toBtns = document.querySelectorAll('.converter .box:last-child .tabs button');
  const rateLeft = document.querySelector('.rate-left');
  const rateRight = document.querySelector('.rate-right');
  
  function formatValue(num) {
    return num.toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 5
    }).replace(',', '.');
  }
  
  async function loadRates(base) {
    if (!navigator.onLine) {
      document.querySelector('.error-message').innerText = 'İnternet bağlantınız yoxdur. Lütfən, internet bağlantınızı yoxlayın və səhifəni yenidən cəhd edin.';
      document.querySelector('.error-message').style.display = 'block';
      fromInput.disabled = true;
      toInput.disabled = true;
      return;
    }
  
    try {
      const res = await fetch(` https://v6.exchangerate-api.com/v6/cdcbdc4e348e6186550979a6/latest/${base}`);
      const data = await res.json();
      if (data.result === "success") {
        rates = data.conversion_rates;
        document.querySelector('.error-message').style.display = 'none';
        fromInput.disabled = false;
        toInput.disabled = false;
      } else {
        throw new Error("Məzənnə tapılmadı");
      }
    } catch (err) {
      document.querySelector('.error-message').innerText = 'Xəta baş verdi: Zəhmət olmasa internet bağlantınızı yoxlayın və səhifəni yeniləyin.';
      document.querySelector('.error-message').style.display = 'block';
    }
  }
  
  window.addEventListener('online', () => {
    document.querySelector('.error-message').style.display = 'none';
    loadRates(fromCurr);
  });
  
  window.addEventListener('offline', () => {
    document.querySelector('.error-message').innerText = 'İnternet bağlantınız yoxdur. Lütfən, internet bağlantınızı yoxlayın və səhifəni yenidən cəhd edin.';
    document.querySelector('.error-message').style.display = 'block';
    fromInput.disabled = true;
    toInput.disabled = true;
  });
  
  function updateButtons() {
    fromBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.currency === fromCurr));
    toBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.currency === toCurr));
  }
  
  function cleanInput(val) {
    let value = val.replace(',', '.').replace(/[^0-9.]/g, '');
    const dotIndex = value.indexOf('.');
    if (dotIndex !== -1) {
      const intPart = value.slice(0, dotIndex + 1);
      const decPart = value.slice(dotIndex + 1).replace(/\./g, '');
      value = intPart + decPart;
    }
    if (value === '.') value = '0.';
    if (value.includes('.')) {
      const [intPart, decPart] = value.split('.');
      value = intPart + '.' + decPart.slice(0, 5);
    }
    if (value.replace('.', '').length > 16) {
      const parts = value.split('.');
      const whole = parts[0].slice(0, 16);
      value = parts.length > 1 ? `${whole}.${parts[1].slice(0, 5)}` : whole;
    }
    return value;
  }
  
  function calculate() {
    const rate = rates[toCurr];
    const reverseRate = 1 / rate;
  
    if (fromCurr === toCurr) {
      const value = activeField === 'from'
        ? parseFloat(fromInput.value.replace(/\s/g, ''))
        : parseFloat(toInput.value.replace(/\s/g, ''));
  
      if (isNaN(value)) {
        fromInput.value = '';
        toInput.value = '';
      } else {
        const formatted = formatValue(value);
        fromInput.value = formatted;
        toInput.value = formatted;
      }
  
      rateLeft.textContent = `1 ${fromCurr} = 1 ${toCurr}`;
      rateRight.textContent = `1 ${toCurr} = 1 ${fromCurr}`;
      return;
    }
  
    if (activeField === 'from') {
      const amount = parseFloat(fromInput.value.replace(/\s/g, ''));
      toInput.value = isNaN(amount) ? '' : formatValue(amount * rate);
    } else {
      const amount = parseFloat(toInput.value.replace(/\s/g, ''));
      fromInput.value = isNaN(amount) ? '' : formatValue(amount * reverseRate);
    }
  
    rateLeft.textContent = `1 ${fromCurr} = ${rate.toFixed(5).replace('.', ',')} ${toCurr}`;
    rateRight.textContent = `1 ${toCurr} = ${(reverseRate).toFixed(5).replace('.', ',')} ${fromCurr}`;
  }
  
  fromBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      fromCurr = btn.dataset.currency;
      updateButtons();
      await loadRates(fromCurr);
      calculate();
    });
  });
  
  toBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toCurr = btn.dataset.currency;
      updateButtons();
      calculate();
    });
  });
  
  fromInput.addEventListener('input', () => {
    if (isTyping) return;
    isTyping = true;
    activeField = 'from';
    fromInput.value = cleanInput(fromInput.value);
    calculate();
    isTyping = false;
  });
  
  toInput.addEventListener('input', () => {
    if (isTyping) return;
    isTyping = true;
    activeField = 'to';
    toInput.value = cleanInput(toInput.value);
    calculate();
    isTyping = false;
  });
  
  loadRates(fromCurr).then(() => calculate());
  