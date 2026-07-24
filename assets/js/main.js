/* ============================================================
   TITAN GEL — v10 Direct-Response Order Page
   ============================================================ */
(function () {
  'use strict';

  var WHATSAPP = '971555659304';
  var BOT_TOKEN = '8747279612:AAEh091B1EgM8Z0OesJ_-7C8HcvhjIdO-3o';
  var CHAT_ID = '595601835';
  var SHIP_FROM = 50; // الشحن يبدأ من 50 ج.م — يُؤكد عند التواصل
  var PRICES = { 1: 350, 2: 700, 3: 1050 };
  var OLDP  = { 1: 500, 2: 1000, 3: 1500 };
  var QTY_LABEL = { 1: 'قطعة واحدة', 2: 'قطعتان', 3: '3 قطع' };

  /* ---------- countdown (daily) ---------- */
  var cd = document.getElementById('countdown-mini');
  function pad(n) { return String(n).padStart(2, '0'); }
  function tick() {
    var now = new Date();
    var end = new Date(now); end.setHours(23, 59, 59, 999);
    var s = Math.max(0, Math.floor((end - now) / 1000));
    if (cd) cd.textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
  }
  tick(); setInterval(tick, 1000);

  /* ---------- qty pills ---------- */
  var pills = document.querySelectorAll('.pill');
  var qtyInput = document.getElementById('f-qty');
  function currentQty() { return parseInt(qtyInput.value, 10) || 1; }
  function updateTotal() {
    var t = PRICES[currentQty()] + ' ج.م';
    var el1 = document.getElementById('total');
    var el2 = document.getElementById('sticky-total');
    if (el1) el1.textContent = t;
    if (el2) el2.textContent = t;
  }
  pills.forEach(function (p) {
    p.addEventListener('click', function () {
      pills.forEach(function (x) { x.classList.remove('selected'); });
      p.classList.add('selected');
      qtyInput.value = p.dataset.qty;
      updateTotal();
    });
  });
  updateTotal();

  /* ---------- smooth scroll to form ---------- */
  document.querySelectorAll('.js-to-form').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('order-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(function () { var n = document.getElementById('f-name'); if (n) n.focus({ preventScroll: true }); }, 600);
    });
  });

  /* ---------- order form ---------- */
  var form = document.getElementById('orderForm');
  if (!form) return;
  var btn = form.querySelector('.btn-order');
  var msg = document.getElementById('form-msg');
  var modal = document.getElementById('success-modal');
  var modalWa = document.getElementById('modal-wa');
  var modalId = document.getElementById('modal-order-id');
  document.getElementById('modal-close').addEventListener('click', function () { modal.classList.remove('open'); });

  function fail(text, input) {
    msg.className = 'form-msg error';
    msg.textContent = text;
    if (input) { input.classList.add('err'); input.focus(); }
    btn.classList.remove('loading');
  }
  form.querySelectorAll('input').forEach(function (i) {
    i.addEventListener('input', function () { i.classList.remove('err'); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.className = 'form-msg'; msg.textContent = '';
    btn.classList.add('loading');

    var name = form.name.value.trim();
    var phone = String(form.phone.value).replace(/\D/g, '');
    var city = form.city.value.trim();
    var address = form.address.value.trim();

    if (name.length < 3) return fail('من فضلك اكتب الاسم بالكامل.', form.name);
    if (phone.length < 10) return fail('من فضلك اكتب رقم هاتف صحيح.', form.phone);
    if (city.length < 2) return fail('من فضلك اكتب المحافظة.', form.city);
    if (address.length < 5) return fail('من فضلك اكتب العنوان بالتفصيل.', form.address);

    var qty = currentQty();
    var total = PRICES[qty];
    var now = new Date();
    var orderId = 'TG-' + now.getTime().toString(36).toUpperCase();

    var waMsg = '🔥 *طلب جديد — TITAN GEL*\n'
      + '━━━━━━━━━━━━━━━━━━\n'
      + '🆔 رقم الطلب: ' + orderId + '\n'
      + '👤 الاسم: ' + name + '\n'
      + '📞 الهاتف: ' + phone + '\n'
      + '🏛️ المحافظة: ' + city + '\n'
      + '📍 العنوان: ' + address + '\n'
      + '📦 الكمية: ' + QTY_LABEL[qty] + '\n'
      + '💵 إجمالي المنتج: ' + total + ' ج.م (بعد خصم 40% — بدل ' + OLDP[qty] + ')\n'
      + '🚚 الشحن: يبدأ من ' + SHIP_FROM + ' ج.م — يُؤكد مع خدمة العملاء\n'
      + '⏱️ التوصيل خلال 1-3 أيام\n'
      + '💳 الدفع عند الاستلام';
    var waUrl = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(waMsg);

    /* Telegram notify (silent) */
    try {
      fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, parse_mode: 'Markdown', text: waMsg + '\n🕒 ' + now.toLocaleString('ar-EG') })
      }).catch(function () {});
    } catch (err) { /* silent */ }

    /* Local save for admin */
    try {
      var orders = JSON.parse(localStorage.getItem('titan_orders') || '[]');
      orders.unshift({ id: orderId, name: name, phone: phone, city: city, address: address,
        qty: QTY_LABEL[qty], subtotal: total, total: total, notes: '', date: now.toLocaleString('ar-EG') });
      localStorage.setItem('titan_orders', JSON.stringify(orders.slice(0, 500)));
    } catch (err) { /* silent */ }

    setTimeout(function () {
      btn.classList.remove('loading');
      msg.className = 'form-msg success';
      msg.textContent = '✔ تم استلام طلبك — رقم الطلب: ' + orderId;
      modalId.textContent = 'رقم الطلب: ' + orderId;
      modalWa.href = waUrl;
      modal.classList.add('open');
      form.reset();
      qtyInput.value = '1';
      pills.forEach(function (x, i) { x.classList.toggle('selected', i === 0); });
      updateTotal();
      window.open(waUrl, '_blank');
    }, 600);
  });
})();
