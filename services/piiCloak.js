/**
 * pii-cloak (JS-порт) — обратимая маскировка PII перед отправкой в LLM.
 * Для Node-сервисов KM2B (боты ветеринар/салоны/автосервис на Node.js).
 *
 * API:
 *   const { text, vault } = cloak(userText);        // vault локально, в LLM НЕ слать
 *   const { text } = cloak(userText, vault);         // переиспользовать vault (общий маппинг)
 *   const restored = uncloak(llmReply, vault);       // восстановить оригиналы
 *
 * Общий vault: одинаковый оригинал -> одинаковая синтетика во всех вызовах
 * (важно для сохранения контекста между сообщениями диалога).
 *
 * Детект РФ: телефон, email, карта (Луна), счёт 20 цифр, ИНН, СНИЛС, паспорт,
 * суммы ₽, ФИО (отчество + словарь имён). Ограничения — см. README.
 */

const RU_FIRST_NAMES = new Set([
  'александр','алексей','андрей','антон','артём','артем','борис','вадим','валентин',
  'валерий','василий','виктор','виталий','владимир','владислав','вячеслав','геннадий',
  'георгий','григорий','даниил','денис','дмитрий','евгений','егор','иван','игорь','илья',
  'кирилл','константин','лев','леонид','максим','матвей','михаил','никита','николай','олег',
  'павел','пётр','петр','роман','руслан','сергей','станислав','степан','тимофей','фёдор',
  'федор','юрий','ярослав','анна','алёна','алена','алина','анастасия','валентина','вера',
  'виктория','галина','дарья','евгения','екатерина','елена','жанна','ирина','карина',
  'кристина','лариса','лидия','любовь','людмила','маргарита','марина','мария','надежда',
  'наталья','наталия','нина','оксана','ольга','полина','светлана','софия','софья','тамара',
  'татьяна','юлия','яна',
]);

const FAKE_NAMES = [
  'Пётр Смирнов','Ольга Кузнецова','Андрей Попов','Мария Соколова',
  'Игорь Лебедев','Елена Новикова','Роман Морозов','Дарья Волкова',
];

// Регексы (флаг g для finditer-подобного обхода)
const RE = {
  email: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g,
  phone: /(?<!\d)(?:\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}(?!\d)/g,
  card: /(?<!\d)\d(?:[ \-]?\d){12,18}(?!\d)/g, // 13–19 цифр, уточняется Луной
  account: /(?<!\d)\d{20}(?!\d)/g,
  snils: /(?<!\d)\d{3}-\d{3}-\d{3}[\s\-]\d{2}(?!\d)/g,
  passport: /(?<!\d)\d{2}\s?\d{2}\s\d{6}(?!\d)/g,
  inn: /(?<!\d)\d{12}(?!\d)|(?<!\d)\d{10}(?!\d)/g,
  money: /(?<!\d)\d[\d .]*(?:,\d{1,2})?\s?(?:₽|руб(?:\.|лей|ля)?|р\.)/gi,
  patronymic: /([А-ЯЁ][а-яё]+)\s+([А-ЯЁ][а-яё]+(?:вич|вна|ична|инична))/g,
  nameWord: /[А-ЯЁ][а-яё]+/g,
};

const PRIO = { email:9, phone:8, card:8, account:7, passport:7, snils:7, inn:5, money:4, name:3 };

function luhnOk(digits) {
  let sum = 0, alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d; alt = !alt;
  }
  return sum % 10 === 0;
}

function collectMatches(text) {
  const matches = [];
  const push = (start, end, kind) => matches.push({ start, end, kind, text: text.slice(start, end) });

  let m;
  for (const [kind, base] of [['email',RE.email],['phone',RE.phone],['account',RE.account],
       ['snils',RE.snils],['passport',RE.passport],['inn',RE.inn],['money',RE.money]]) {
    const re = new RegExp(base.source, base.flags);
    while ((m = re.exec(text)) !== null) push(m.index, m.index + m[0].length, kind);
  }
  // карта — только валидная по Луну
  { const re = new RegExp(RE.card.source, RE.card.flags);
    while ((m = re.exec(text)) !== null) {
      const digits = m[0].replace(/\D/g, '');
      if (digits.length >= 13 && digits.length <= 19 && luhnOk(digits))
        push(m.index, m.index + m[0].length, 'card');
    } }
  // ФИО через отчество
  { const re = new RegExp(RE.patronymic.source, RE.patronymic.flags);
    while ((m = re.exec(text)) !== null) push(m.index, m.index + m[0].length, 'name'); }
  // Имя из словаря (+ след. слово с заглавной)
  { const re = new RegExp(RE.nameWord.source, RE.nameWord.flags);
    while ((m = re.exec(text)) !== null) {
      if (!RU_FIRST_NAMES.has(m[0].toLowerCase())) continue;
      const after = text.slice(m.index + m[0].length);
      const nxt = /^\s+([А-ЯЁ][а-яё]+)/.exec(after);
      if (nxt && nxt[0].trimStart() === nxt[1]) // ровно один разделитель-пробел
        push(m.index, m.index + m[0].length + nxt[0].length, 'name');
      else
        push(m.index, m.index + m[0].length, 'name');
    } }

  // разрешение пересечений: приоритет, затем длина
  matches.sort((a, b) => (PRIO[b.kind]||0) - (PRIO[a.kind]||0) || (b.end-b.start) - (a.end-a.start));
  const chosen = [], occ = [];
  for (const mt of matches) {
    if (occ.some(([s, e]) => !(mt.end <= s || mt.start >= e))) continue;
    chosen.push(mt); occ.push([mt.start, mt.end]);
  }
  chosen.sort((a, b) => a.start - b.start);
  return chosen;
}

function fake(kind, n) {
  switch (kind) {
    case 'email': return `user${n}@example-mail.ru`;
    case 'phone': return `+7 900 555-${String(n%100).padStart(2,'0')}-${String((n*7)%100).padStart(2,'0')}`;
    case 'card': {
      const base = ('4000' + String(n).padStart(12,'0')).slice(0,15);
      for (let c = 0; c < 10; c++) if (luhnOk(base + c)) {
        const full = base + c; return `${full.slice(0,4)} **** **** ${full.slice(-4)}`;
      }
      return '4000 0000 0000 0000';
    }
    case 'account': return '40817' + String((n*37) % 1e15).padStart(15,'0');
    case 'snils': return `${String(100+n).padStart(3,'0')}-${String(200+n).padStart(3,'0')}-${String(300+n).padStart(3,'0')} 00`;
    case 'passport': return `00${String(n%100).padStart(2,'0')} ${String((n*13)%1e6).padStart(6,'0')}`;
    case 'inn': return '7700' + String((n*101)%1e8).padStart(8,'0');
    case 'money': return `${(n+1)*1000} руб.`;
    case 'name': return FAKE_NAMES[n % FAKE_NAMES.length];
    default: return `[PII${n}]`;
  }
}

/**
 * Маскирует PII. vault можно передать для переиспользования маппинга между вызовами.
 * @returns {{ text: string, vault: {map: Object, rev: Object, counters: Object} }}
 */
function cloak(text, vault) {
  vault = vault || { map: {}, rev: {}, counters: {} }; // map: fake->orig, rev: orig->fake
  const matches = collectMatches(text);
  let out = '', prev = 0;
  for (const mt of matches) {
    out += text.slice(prev, mt.start);
    let f = vault.rev[mt.text]; // уже видели этот оригинал?
    if (!f) {
      let n = vault.counters[mt.kind] || 0;
      f = fake(mt.kind, n);
      while (vault.map[f] !== undefined && vault.map[f] !== mt.text) { n++; f = fake(mt.kind, n); }
      vault.counters[mt.kind] = n + 1;
      vault.map[f] = mt.text; vault.rev[mt.text] = f;
    }
    out += f; prev = mt.end;
  }
  out += text.slice(prev);
  return { text: out, vault };
}

/** Восстанавливает оригиналы (длинные fake раньше коротких, чтобы не было частичных замен). */
function uncloak(text, vault) {
  if (!vault || !vault.map) return text;
  for (const f of Object.keys(vault.map).sort((a, b) => b.length - a.length)) {
    text = text.split(f).join(vault.map[f]);
  }
  return text;
}

/** Хелпер для чат-API: маскирует массив messages [{role,content}] общим vault. */
function cloakMessages(messages, vault) {
  vault = vault || { map: {}, rev: {}, counters: {} };
  const masked = messages.map((msg) => {
    if (typeof msg.content !== 'string') return msg;
    const r = cloak(msg.content, vault);
    return { ...msg, content: r.text };
  });
  return { messages: masked, vault };
}

export { cloak, uncloak, cloakMessages, luhnOk };
