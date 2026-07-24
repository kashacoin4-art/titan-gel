/* ============================================================
   TITAN GEL — v7 Premium Redesign (main.js)
   ============================================================ */
(function () {
  'use strict';

  var WHATSAPP = '971555659304';            // +971 55 565 9304
  var BOT_TOKEN = '8747279612:AAEh091B1EgM8Z0OesJ_-7C8HcvhjIdO-3o';
  var CHAT_ID = '595601835';
  var SHIP_FROM = 50;   // الشحن يبدأ من 50 ج.م — يُؤكد عند التواصل
  var PRICES = { 1: 350, 2: 700, 3: 1050 };
  var QTY_LABEL = { 1: 'قطعة واحدة', 2: 'قطعتان', 3: '3 قطع' };

  /* ---------- scroll progress + navbar ---------- */
  var bar = document.getElementById('progress-bar');
  var navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function () {
    var h = document.documentElement;
    var sc = h.scrollTop / (h.scrollHeight - h.clientHeight);
    if (bar) bar.style.width = (sc * 100) + '%';
    if (navbar) navbar.classList.toggle('scrolled', h.scrollTop > 30);
  }, { passive: true });

  /* ---------- reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- animated counters ---------- */
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target, target = parseInt(el.dataset.count, 10) || 0;
      var t0 = null;
      function tick(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1400, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.counter').forEach(function (el) { cio.observe(el); });

  /* ---------- countdown (resets daily) ---------- */
  var cd = document.getElementById('countdown-mini');
  var dh=document.getElementById('dt-h'), dm=document.getElementById('dt-m'), ds=document.getElementById('dt-s');
  function pad(n) { return String(n).padStart(2, '0'); }
  function tickCd() {
    var now = new Date();
    var end = new Date(now); end.setHours(23, 59, 59, 999);
    var s = Math.max(0, Math.floor((end - now) / 1000));
    var H=pad(Math.floor(s/3600)), M=pad(Math.floor(s%3600/60)), S=pad(s%60);
    if (cd) cd.textContent = H + ':' + M + ':' + S;
    if (dh) { dh.textContent = H; dm.textContent = M; ds.textContent = S; }
  }
  tickCd(); setInterval(tickCd, 1000);

  /* ---------- plan cards <-> qty select ---------- */
  var qtySelect = document.getElementById('f-qty');
  var plans = document.querySelectorAll('.plan');
  function selectPlan(qty, scroll) {
    plans.forEach(function (p) { p.classList.toggle('selected', p.dataset.qty === String(qty)); });
    if (qtySelect) qtySelect.value = String(qty);
    updateTotal();
    if (scroll) document.getElementById('order-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  plans.forEach(function (p) {
    p.addEventListener('click', function () { selectPlan(p.dataset.qty, true); });
  });
  if (qtySelect) qtySelect.addEventListener('change', function () { selectPlan(qtySelect.value, false); });

  /* ---------- live total ---------- */
  function currentQty() { return parseInt(qtySelect ? qtySelect.value : '2', 10) || 2; }
  function currentTotal() { return PRICES[currentQty()]; }
  function updateTotal() {
    var t = currentTotal() + ' ج.م';
    var el1 = document.getElementById('total');
    var el2 = document.getElementById('sticky-total');
    if (el1) el1.textContent = t;
    if (el2) el2.textContent = t;
    var det = document.getElementById('total-detail');
    if (det) det.textContent = '+ الشحن يبدأ من ' + SHIP_FROM + ' ج.م ويُؤكد معك واتساب';
  }
  selectPlan(1, false);

  /* ---------- hero parallax ---------- */
  var stage = document.getElementById('product-stage');
  if (stage && window.matchMedia('(pointer:fine)').matches) {
    document.addEventListener('mousemove', function (e) {
      var x = (e.clientX / window.innerWidth - .5) * 14;
      var y = (e.clientY / window.innerHeight - .5) * 10;
      stage.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    }, { passive: true });
  }

  /* ---------- order form ---------- */
  var form = document.getElementById('order-form');
  if (!form) return;
  var btn = form.querySelector('.btn-submit');
  var msg = document.getElementById('form-msg');
  var modal = document.getElementById('success-modal');
  var modalWa = document.getElementById('modal-wa');
  var modalId = document.getElementById('modal-order-id');
  document.getElementById('modal-close').addEventListener('click', function () {
    modal.classList.remove('open');
  });

  function fail(text, input) {
    msg.className = 'form-msg error';
    msg.textContent = text;
    if (input) { input.classList.add('err'); input.focus(); }
    btn.classList.remove('loading');
  }
  form.querySelectorAll('input,textarea').forEach(function (i) {
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
    var notes = (form.notes.value || '').trim();

    if (name.length < 3) return fail('من فضلك اكتب الاسم بالكامل.', form.name);
    if (phone.length < 10) return fail('من فضلك اكتب رقم هاتف صحيح.', form.phone);
    if (city.length < 2) return fail('من فضلك اكتب المحافظة.', form.city);
    if (address.length < 5) return fail('من فضلك اكتب العنوان بالتفصيل.', form.address);

    var qty = currentQty();
    var subtotal = PRICES[qty];
    var total = currentTotal();
    var now = new Date();
    var orderId = 'TG-' + now.getTime().toString(36).toUpperCase();

    /* WhatsApp message */
    var waMsg = '🔥 *طلب جديد — TITAN GEL*\n'
      + '━━━━━━━━━━━━━━━━━━\n'
      + '🆔 رقم الطلب: ' + orderId + '\n'
      + '👤 الاسم: ' + name + '\n'
      + '📞 الهاتف: ' + phone + '\n'
      + '🏛️ المحافظة: ' + city + '\n'
      + '📍 العنوان: ' + address + '\n'
      + '📦 الكمية: ' + QTY_LABEL[qty] + '\n'
      + '💵 إجمالي المنتج: ' + total + ' ج.م (بعد خصم 40%)\n'
      + '🚚 الشحن: يبدأ من ' + SHIP_FROM + ' ج.م — يُؤكد مع خدمة العملاء\n'
      + '⏱️ التوصيل خلال 1-3 أيام\n'
      + (notes ? '📝 ملاحظات: ' + notes + '\n' : '')
      + '💳 الدفع عند الاستلام';
    var waUrl = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(waMsg);

    /* Telegram notification (background, silent) */
    try {
      fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, parse_mode: 'Markdown', text: waMsg + '\n🕒 ' + now.toLocaleString('ar-EG') })
      }).catch(function () {});
    } catch (err) { /* silent */ }

    /* Local save for admin page (same storage key as before) */
    try {
      var orders = JSON.parse(localStorage.getItem('titan_orders') || '[]');
      orders.unshift({
        id: orderId, name: name, phone: phone, city: city, address: address,
        qty: QTY_LABEL[qty], subtotal: subtotal, total: total, notes: notes,
        date: now.toLocaleString('ar-EG')
      });
      localStorage.setItem('titan_orders', JSON.stringify(orders.slice(0, 500)));
    } catch (err) { /* silent */ }

    /* success */
    setTimeout(function () {
      btn.classList.remove('loading');
      msg.className = 'form-msg success';
      msg.textContent = '✔ تم استلام طلبك — رقم الطلب: ' + orderId;
      modalId.textContent = 'رقم الطلب: ' + orderId;
      modalWa.href = waUrl;
      modal.classList.add('open');
      form.reset();
      selectPlan(1, false);
      var w = window.open(waUrl, '_blank');
      if (!w) { /* popup blocked — modal button covers it */ }
    }, 600);
  });
})();
