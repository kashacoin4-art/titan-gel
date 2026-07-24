/* TITAN GEL — Main JS v4 — WhatsApp Order System */
(function () {
  'use strict';

  // ===== Countdown (عرض ثابت — ينتهي بعد 7 أيام من أول زيارة) =====
  var cdH = document.getElementById('cd-h');
  var cdM = document.getElementById('cd-m');
  var cdS = document.getElementById('cd-s');
  var tb  = document.getElementById('topbar-timer');

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  var offerEnd;
  try {
    var saved = localStorage.getItem('titan_offer_end');
    if (saved) {
      offerEnd = new Date(parseInt(saved, 10));
    } else {
      offerEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      localStorage.setItem('titan_offer_end', String(offerEnd.getTime()));
    }
  } catch (e) {
    offerEnd = new Date(Date.now() + 48 * 60 * 60 * 1000);
  }

  function tick() {
    var now = new Date();
    var diff = Math.max(0, Math.floor((offerEnd - now) / 1000));
    var h = Math.floor(diff / 3600); diff -= h * 3600;
    var m = Math.floor(diff / 60);   diff -= m * 60;
    var s = diff;
    if (cdH) cdH.textContent = pad(h);
    if (cdM) cdM.textContent = pad(m);
    if (cdS) cdS.textContent = pad(s);
    if (tb)  tb.textContent  = pad(h) + ':' + pad(m) + ':' + pad(s);

    if (h === 0 && m === 0 && s === 0) {
      var cd = document.getElementById('countdown');
      if (cd) cd.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#fca5a5;font-weight:700;padding:12px">العرض متاح — اطلب الآن!</div>';
      if (tb) tb.textContent = 'اطلب الآن!';
    }
  }
  tick(); setInterval(tick, 1000);

  // ===== Scroll reveal =====
  var els = document.querySelectorAll('.step,.result-card,.ing,.why,.test,.order-form,.price-box');
  els.forEach(function(el) { el.classList.add('reveal'); });
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(function(el) { io.observe(el); });

  // ===== Navbar scroll effect =====
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // ===== التسعير =====
  var PRICES = { 1: 350, 2: 650, 3: 900 };
  var SHIPPING = 50;
  var DOCTOR_PHONE = '201213833029';

  // ===== Order form — WhatsApp =====
  var form = document.getElementById('order-form');
  if (!form) return;
  var btn  = form.querySelector('.btn-submit');
  var msg  = document.getElementById('form-msg');

  // تحديث المجموع ديناميكيًا
  var qtySelect = form.querySelector('select[name="qty"]');
  var totalDisplay = document.getElementById('live-total');
  function updateTotal() {
    if (!qtySelect || !totalDisplay) return;
    var q = parseInt(qtySelect.value, 10) || 1;
    var sub = PRICES[q] || (q * 350);
    totalDisplay.textContent = (sub + SHIPPING) + ' ج.م';
  }
  if (qtySelect) qtySelect.addEventListener('change', updateTotal);
  updateTotal();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.className = 'form-msg';
    msg.textContent = '';

    var data = {};
    var fd = new FormData(form);
    fd.forEach(function(val, key) { data[key] = val; });

    // تحقق
    if (!data.name || data.name.trim().length < 2) return showErr('الرجاء إدخال الاسم');
    var cleanPhone = String(data.phone || '').replace(/\D/g, '');
    if (!/^01[0125][0-9]{8}$/.test(cleanPhone)) return showErr('رقم هاتف مصري غير صحيح (01xxxxxxxxx)');
    if (!data.city || data.city.trim().length < 2) return showErr('الرجاء إدخال المحافظة');
    if (!data.address || data.address.trim().length < 3) return showErr('الرجاء إدخال العنوان بالتفصيل');

    btn.classList.add('loading'); btn.disabled = true;

    // حساب الإجمالي
    var qty = parseInt(data.qty, 10) || 1;
    var subtotal = PRICES[qty] || (qty * 350);
    var total = subtotal + SHIPPING;

    // رقم الطلب
    var now = new Date();
    var orderId = 'TG-' + now.getFullYear()
      + pad(now.getMonth() + 1) + pad(now.getDate())
      + '-' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());

    // تركيب رسالة واتساب
    var qtyLabel = qty === 1 ? 'قطعة واحدة' : (qty === 2 ? 'قطعتان' : qty + ' قطع');
    var whatsappMsg = '🔥 *طلب جديد — TITAN GEL*\n'
      + '━━━━━━━━━━━━━━━━━━\n'
      + '🆔 رقم الطلب: ' + orderId + '\n'
      + '👤 الاسم: ' + data.name.trim() + '\n'
      + '📞 الهاتف: ' + cleanPhone + '\n'
      + '🏛️ المحافظة: ' + data.city.trim() + '\n'
      + '📍 العنوان: ' + data.address.trim() + '\n'
      + '📦 الكمية: ' + qtyLabel + '\n'
      + '💵 سعر المنتج: ' + subtotal + ' ج.م\n'
      + '🚚 الشحن: ' + SHIPPING + ' ج.م\n'
      + '💰 *الإجمالي: ' + total + ' ج.م*\n'
      + (data.notes && data.notes.trim() ? '📝 ملاحظات: ' + data.notes.trim() + '\n' : '')
      + '💳 الدفع عند الاستلام\n'
      + '🕒 ' + now.toLocaleString('ar-EG');

    var waUrl = 'https://wa.me/' + DOCTOR_PHONE + '?text=' + encodeURIComponent(whatsappMsg);

    // إرسال إشعار تلجرام في الخلفية
    sendTelegramNotification(orderId, data, qty, qtyLabel, subtotal, total, now);

    // حفظ في Netlify Forms (قاعدة بيانات مدمجة)
    /* Netlify forms disabled on GitHub Pages */

    // حفظ محلي في المتصفح للأدمن
    saveOrderLocally(orderId, data, cleanPhone, qty, qtyLabel, subtotal, total, now);

    // عرض رسالة النجاح
    msg.className = 'form-msg success';
    msg.innerHTML = '<div class="success-box">'
      + '<div class="success-icon"><i class="fas fa-check-circle"></i></div>'
      + '<h4>تم تسجيل طلبك بنجاح!</h4>'
      + '<p>رقم الطلب: <strong>' + orderId + '</strong></p>'
      + '<p>الإجمالي: <strong>' + total + ' ج.م</strong> (شامل الشحن)</p>'
      + '<p class="success-note">سيتم فتح واتساب الآن لتأكيد الطلب...</p>'
      + '</div>';

    form.reset();
    updateTotal();
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    btn.classList.remove('loading'); btn.disabled = false;

    // فتح واتساب بعد لحظة
    setTimeout(function() {
      window.open(waUrl, '_blank');
    }, 1200);
  });

  function showErr(text) {
    msg.className = 'form-msg error';
    msg.textContent = '❌ ' + text;
    btn.classList.remove('loading'); btn.disabled = false;
  }

  // ===== Telegram Notification (يعمل في الخلفية) =====
  function sendTelegramNotification(orderId, data, qty, qtyLabel, subtotal, total, now) {
    var BOT_TOKEN = '8747279612:AAEh091B1EgM8Z0OesJ_-7C8HcvhjIdO-3o';
    var CHAT_ID = '595601835';

    var text = '🔥 *طلب جديد - TITAN GEL*\n'
      + '━━━━━━━━━━━━━━━━━━\n'
      + '🆔 رقم الطلب: `' + orderId + '`\n'
      + '👤 الاسم: *' + data.name.trim() + '*\n'
      + '📞 الهاتف: `' + String(data.phone).replace(/\D/g, '') + '`\n'
      + '🏛️ المحافظة: ' + data.city.trim() + '\n'
      + '📍 العنوان: ' + data.address.trim() + '\n'
      + '📦 الكمية: *' + qtyLabel + '*\n'
      + '💵 سعر المنتج: ' + subtotal + ' ج.م\n'
      + '🚚 الشحن: ' + SHIPPING + ' ج.م\n'
      + '💰 *الإجمالي: ' + total + ' ج.م*\n'
      + (data.notes && data.notes.trim() ? '📝 ملاحظات: ' + data.notes.trim() + '\n' : '')
      + '💳 الدفع عند الاستلام\n'
      + '🕒 ' + now.toLocaleString('ar-EG');

    try {
      fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: text,
          parse_mode: 'Markdown'
        })
      }).catch(function() { /* silent — WhatsApp is primary */ });
    } catch (e) { /* silent */ }
  }

  // ===== Netlify Forms (حفظ الطلب في قاعدة بيانات Netlify) =====
  function saveToNetlifyForms(orderId, data, phone, qty, qtyLabel, total, now) {
    try {
      var formData = new URLSearchParams();
      formData.append('form-name', 'orders');
      formData.append('order_id', orderId);
      formData.append('name', data.name.trim());
      formData.append('phone', phone);
      formData.append('city', data.city.trim());
      formData.append('address', data.address.trim());
      formData.append('qty', qtyLabel);
      formData.append('total', total + ' ج.م');
      formData.append('notes', (data.notes || '').trim());
      formData.append('date', now.toLocaleString('ar-EG'));

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      }).catch(function() { /* silent */ });
    } catch (e) { /* silent */ }
  }

  // ===== حفظ محلي للأدمن =====
  function saveOrderLocally(orderId, data, phone, qty, qtyLabel, subtotal, total, now) {
    try {
      var orders = JSON.parse(localStorage.getItem('titan_orders') || '[]');
      orders.unshift({
        id: orderId,
        name: data.name.trim(),
        phone: phone,
        city: data.city.trim(),
        address: data.address.trim(),
        qty: qtyLabel,
        subtotal: subtotal,
        total: total,
        notes: (data.notes || '').trim(),
        timestamp: Math.floor(now.getTime() / 1000),
        date: now.toLocaleString('ar-EG')
      });
      localStorage.setItem('titan_orders', JSON.stringify(orders));
    } catch (e) { /* silent */ }
  }

  // ===== Smooth scroll for anchor links =====
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

})();
