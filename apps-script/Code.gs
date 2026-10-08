// Empty Bowl — приём заявок с emptybowl.kz в лист «Заявки»
// Таблица: https://docs.google.com/spreadsheets/d/1zF85zYvFFtGLv8ZSrZcMV0lAwoyJmF2Vab4eiiAEXWM/edit
// Колонки A–V заполняет скрипт, W–Z (предоплата, доплата, ответственный, комментарий) — организатор.

const SHEET = 'Заявки';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (d.website) return out({ ok: true });                        // honeypot — боты
    if (!d.name || !d.phone) return out({ ok: false, error: 'required' });

    const sh = SpreadsheetApp.getActive().getSheetByName(SHEET);
    const id = 'EB-' + Utilities.formatDate(new Date(), 'Asia/Almaty', 'yyMMdd-HHmmss');
    const yn = v => (v === true || v === 'Да' || v === 'Иә') ? 'Да' : 'Нет';

    sh.appendRow([
      new Date(),                 // A  Дата и время
      id,                         // B  ID заявки
      d.city || '',               // C  Город
      d.dates || '',              // D  Поток (даты)
      String(d.name).trim(),      // E  Имя и фамилия
      "'" + d.phone,              // F  Телефон (текстом, чтобы не терять +)
      d.telegram || '',           // G  Telegram
      d.email || '',              // H  Email
      d.residence || '',          // I  Город проживания
      d.returning || '',          // J  Был(а) ранее
      Number(d.price) || '',      // K  Тариф
      yn(d.hotel),                // L  Проживание в Alanda
      d.source || '',             // M  Откуда узнали
      d.comment || '',            // N  Вопрос / комментарий
      yn(d.consent),              // O  Согласие ПД
      d.utm_source || '',         // P
      d.utm_medium || '',         // Q
      d.utm_campaign || '',       // R
      d.utm_content || '',        // S
      d.utm_term || '',           // T
      d.page || '',               // U  Страница / язык / referrer
      'Новая'                     // V  Статус
    ]);

    notify_(d, id);               // уведомление организатору (необязательно)
    return out({ ok: true, id });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Проверка, что веб-приложение опубликовано: открыть URL …/exec в браузере → увидите {"ok":true,"ping":true}
function doGet() {
  return out({ ok: true, ping: true });
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Письмо организатору о новой заявке. Чтобы включить — впишите e-mail.
const NOTIFY_EMAIL = '';
function notify_(d, id) {
  if (!NOTIFY_EMAIL) return;
  try {
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: `Новая заявка ${id} — ${d.name}, ${d.city}`,
      body: `Имя: ${d.name}\nТелефон: ${d.phone}\nГород: ${d.city} (${d.dates})\nБыл(а) ранее: ${d.returning}\nТариф: ${d.price} ₸\nПроживание: ${d.hotel ? 'Да' : 'Нет'}\nВопрос: ${d.comment || '—'}\n\nТаблица: https://docs.google.com/spreadsheets/d/1zF85zYvFFtGLv8ZSrZcMV0lAwoyJmF2Vab4eiiAEXWM/edit`
    });
  } catch (e) {}
}
