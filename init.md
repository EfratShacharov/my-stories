# תיעוד פרויקט my-stories

## מבנה קבצים

```
my-stories/
├── public/                    # קבצים סטטיים
├── src/
│   ├── components/
│   │   ├── Home.jsx           # דף ראשי – רשימת סיפורים + כפתורי "קרא עוד" ו"מאחורי הקלעים"
│   │   ├── StoryPage.jsx      # קריאת סיפור + טופס תגובה + progress bar אינטראקטיבי
│   │   ├── CommentPage.jsx    # עמוד תגובות ציבוריות + טופס הגשה + תגובות משורשרות
│   │   ├── CommentsManager.jsx# ניהול תגובות (מנהל בלבד) — עיצוב זהה ל-CommentPage
│   │   ├── FileManager.jsx    # ניהול סיפורים (מנהל בלבד) — Supabase Storage
│   │   ├── About.jsx          # דף אודות — טקסט סטטי, חלוקה לפסקאות עם כותרות
│   │   ├── BehindTheScenes.jsx# דף ציבורי — מאחורי הקלעים לפי story_id, רקע כהה
│   │   ├── BehindManager.jsx  # ניהול מאחורי הקלעים (מנהל בלבד) — CRUD מול Supabase
│   │   ├── Navbar.jsx         # ניווט עליון
│   │   ├── AuthModal.jsx      # מודל התחברות / הרשמה / OTP
│   ├── context/
│   │   └── CommentsContext.jsx# Context גלובלי לתגובות + Realtime subscription + קריאה ל-edge functions
│   ├── supabase.js            # אתחול Supabase client
│   ├── App.js                 # נתב ראשי + ניהול session
│   └── index.js               # נקודת כניסה
├── .env                       # משתני סביבה לפרונטאנד
├── init.md                    # תיעוד הפרויקט
└── package.json
```

---

## טכנולוגיות

| טכנולוגיה | גרסה | שימוש |
|---|---|---|
| React | 19 | UI framework |
| React Router DOM | 7 | ניווט בין עמודים |
| MUI (Material UI) | 7 | רכיבי UI |
| @mui/icons-material | 7 | אייקונים (CreateIcon, AutoStoriesIcon, DownloadIcon, ArrowForwardIcon וכו') |
| Emotion | 11 | CSS-in-JS |
| stylis-plugin-rtl | 2 | תמיכה גלובלית בכיוון RTL |
| Supabase JS | 2 | Backend: auth + database + storage + Realtime + Edge Functions |
| mammoth | 1 | המרת קבצי DOCX לטקסט |
| framer-motion | 12 | אנימציות |

---

## קריאות ל-Supabase

### טבלת `stories`

| פעולה | מתבצע ב | תיאור |
|---|---|---|
| `select id, title, docx_url, pdf_url` | Home, StoryPage, CommentPage | טעינת רשימת סיפורים |
| `select * order by id` | FileManager | טעינת כל הסיפורים לניהול |
| `insert { title, docx_url, pdf_url }` | FileManager.handleSave | הוספת סיפור חדש (כולל URLs בבת אחת) |
| `update { title / docx_url / pdf_url }` | FileManager.handleSave | עדכון סיפור |
| `delete` | FileManager.handleDeleteConfirm | מחיקת סיפור |

**מבנה רשומת story:**
```js
{ id, title, docx_url, pdf_url }
```

**Supabase Storage — bucket `stories`:**
- קבצים נשמרים לפי שם הקובץ המקורי שהועלה (לא `story_{id}`)
- תווים עבריים עוברים transliteration לאנגלית, תווים מיוחדים מוחלפים ב-`_`
- `upsert: true` — מאפשר החלפת קובץ קיים
- DOCX נפתח דרך Office Viewer: `https://view.officeapps.live.com/op/view.aspx?src=...`
- PDF נפתח ישירות בדפדפן: `window.open(url, "_blank")`
- במחיקת סיפור — קבצי ה-DOCX וה-PDF נמחקים מה-Storage לפני מחיקת הרשומה מה-DB
- העלאת קבצים מתבצעת לפני כתיבה ל-DB; אם ה-DB נכשל — הקבצים שהועלו נמחקים (rollback)

**RLS Policies נדרשות על `stories`:**
```sql
CREATE POLICY "anyone can read stories" ON stories FOR SELECT USING (true);
CREATE POLICY "admin can insert stories" ON stories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admin can update stories" ON stories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin can delete stories" ON stories FOR DELETE TO authenticated USING (true);
```

### טבלת `comments`

| פעולה | מתבצע ב | תיאור |
|---|---|---|
| `select * order by created_at desc` | CommentsContext.fetchComments | טעינת כל התגובות |
| `insert` | CommentsContext.addComment | הוספת תגובה חדשה; מחזיר את `id` החדש |
| `update { status }` | CommentsManager.updateStatus | אישור / דחיית תגובה |
| `insert` (is_admin: true, status: approved) | CommentsManager.sendReply | תגובת מנהל |
| `notifyReply(commentId)` | CommentsContext + CommentPage + CommentsManager + StoryPage | לאחר תגובה, מופעל edge function `notify-reply` |
| `POST /functions/v1/notify-reply` | Supabase Edge Function | שולח מייל למי שבחר באפשרות עדכונים |
| Realtime `postgres_changes *` | CommentsContext useEffect | עדכון אוטומטי בכל שינוי |

**מבנה רשומת comment:**
```js
{
  id, name, email,
  story_id,       // null אם נושא "אחר"
  story_title,    // נושא חופשי או שם סיפור
  comment,
  is_admin,       // boolean
  status,         // "pending" | "approved" | "rejected"
  parent_id,      // null = תגובה ראשית, id = תגובה משורשרת
  email_updates,  // boolean — האם לשלוח עדכון במייל כשמשיבים
  created_at
}
```

**RLS policies על `comments`:**
- `SELECT` – משתמשים רגילים רואים רק `status = 'approved'`; מנהל רואה הכל
- `INSERT` – מותר ל-`anon` ו-`authenticated`
- `UPDATE` – מותר ל-`authenticated` בלבד

**חשוב:** יש לוודא שה-Realtime מופעל על טבלת `comments` ב-Supabase Dashboard תחת **Database → Replication**

### הודעות מייל על תגובות
- כאשר מגיב/ה משיב/ה לתגובה קיימת, ה-frontend מקים את התגובה ומעביר את ה-`id` ל-`notifyReply`.
- ה-Edge Function `notify-reply` בודק אם לתגובה ההורה יש `email_updates = true`, אם יש כתובת מייל, ואם לא מדובר באותו אדם.
- אם התנאים מתקיימים, הוא שולח מייל דרך EmailJS (server-side) עם קישור חזרה אל התגובה.
- ההפעלה מתבצעת מ-CommentPage, CommentsManager, ו-StoryPage.

### OTP למנהל
- בעת התחברות עם מייל המנהל, נשלח קוד OTP דרך Edge Function `send-otp`
- ה-Edge Function שולח מייל דרך EmailJS API עם הקוד, תוקף 5 דקות
- הקוד נוצר ב-frontend ונשלח ל-Edge Function יחד עם המייל וזמן התפוגה

### טבלת `users`

| פעולה | מתבצע ב | תיאור |
|---|---|---|
| `select name, is_admin` | App.js.loadUserData | קריאת פרטי משתמש לאחר login |
| `select name, email` | CommentsContext.addComment | שליפת פרטי משתמש מחובר |
| `select name` | CommentsManager (useEffect) | שליפת שם המנהל המחובר |
| `insert` | AuthModal.handleRegister | יצירת משתמש חדש |

**מבנה רשומת user:**
```js
{ id, name, email, email_updates, is_admin }
```

---

## ארכיטקטורה כללית

### תרשים זרימה

```
App.js
├── CommentsProvider (Context – comments, addComment, fetchComments, notifyReply)
├── Navbar (isAdmin, session, userName)
└── Routes
    ├── /                → Home (session, isAdmin)
    ├── /story/:id       → StoryPage (session, isAdmin)
    ├── /comments        → CommentPage (isAdmin, session)
    ├── /about           → About
    ├── /behind/:id      → BehindTheScenes
    ├── /files           → FileManager (מנהל בלבד)
    ├── /manage-comments → CommentsManager (מנהל בלבד)
    └── /manage-behind   → BehindManager (מנהל בלבד)
```

### ניהול מצב

- **session / isAdmin / userName** – מנוהל ב-`App.js`, מועבר כ-props ל-Home, StoryPage, CommentPage
- **comments** – מנוהל ב-`CommentsContext`:
  - נטען פעם אחת עם `fetchComments` ב-useEffect
  - מתעדכן אוטומטית דרך **Supabase Realtime** על כל שינוי בטבלת `comments`
- **RTL** – מוגדר גלובלית דרך MUI ThemeProvider + stylis-plugin-rtl
- **⚠️ חשוב:** `stylis-plugin-rtl` ממיר `right`↔`left` ב-`sx` props — בכל מקום שצריך כיוון פיזי מדויק יש להשתמש ב-**inline `style`**

### הרשאות

| משתמש | יכולות |
|---|---|
| אורח | קריאת סיפורים, הגשת תגובה עם שם + מייל ידני |
| משתמש מחובר | הגשת תגובה (שם ומייל נלקחים מה-DB, שדות מוסתרים) |
| מנהל | הכל + אישור/דחייה/תשובה לתגובות + ניהול סיפורים + ניהול מאחורי הקלעים |

---

## עמוד StoryPage

### מקור נתונים
- סיפור נטען מ-Supabase לפי `id` מה-URL: `select id, title, docx_url, pdf_url`
- תוכן הסיפור נטען מ-`docx_url` ומומר לטקסט דרך `mammoth`

### layout
- **Desktop (md+):** דו-עמודי — טופס תגובה (320px) מימין | Divider | טקסט הסיפור משמאל
- **Mobile:** חד-עמודי — טופס → טקסט (calc(55vh - 16px))

### כותרת
- שמאל: כפתור הורדת PDF (`DownloadIcon`)
- מרכז: כותרת הסיפור
- ימין: כפתור חזרה לדף הבית (`ArrowForwardIcon`)

### טופס תגובה
- שדות שם + מייל (לאורחים בלבד) עם `inputProps` לכיוון נכון
- צ'קבוקס `emailUpdates` — "שלחו לי עדכון במייל כאשר ישיבו לתגובה שלי"
- כפתור שליחה בגרדיאנט סגול עם `submitting` state וספינר
- לאחר שליחה — `notifyReply` נקרא עם ה-`id` של התגובה החדשה

### עיצוב טקסט הסיפור
- שורות רגילות (עברית + מספרים + פיסוק): `lineHeight: 1.75`, `textAlign: right`, `direction: rtl`
- שורות עם סימנים מיוחדים: `textAlign: center`
- שורה ריקה = מעבר פסקה (`height: 0.6em`)

### progress bar
- ממוקם בתוך עמודת הסיפור בלבד
- מתמלא מימין לשמאל לפי גלילה
- **אינטראקטיבי** — לחיצה גוללת smooth לנקודה המתאימה
- מיושם עם `scaleX` + `direction: ltr` (inline style) כדי לעקוף stylis-plugin-rtl

```js
// מילוי ויזואלי — scaleX מימין לשמאל
transformOrigin: "100% 50%", transform: `scaleX(${scrollProgress / 100})`
// חישוב לחיצה
const fraction = 1 - (clickX / rect.width);
```

### גלילה
- `document.body.style.overflow = "hidden"` בעת טעינת הדף
- scrollbar מוסתר לחלוטין (`display: none` + `scrollbarWidth: none`)

---

## עמוד Home

- סיפורים נטענים מ-Supabase: `select id, title, docx_url, pdf_url` ממוינים לפי `id`
- תקציר אוטומטי מ-DOCX דרך `mammoth` (5 שורות, 17 מילים לשורה), מוצג עם `WebkitLineClamp: 10`
- לכל סיפור שני כפתורים:
  - **קרא עוד** (`variant="contained"`) — מנווט ל-`/story/:id`
  - **מאחורי הקלעים** (`variant="outlined"`, צבע זהב, `TheaterComedyIcon`) — מנווט ל-`/behind/:id`

---

## ניהול תגובות

### CommentPage (ציבורי)
- כפתור "הוספת תגובה משלך" נדבק למעלה (`position: sticky`) בזמן גלילה
- הטופס מוצג מעל רשימת התגובות
- מוצגות רק תגובות ראשיות `approved` עם `parent_id = null`
- רשימת סיפורים לטופס נטענת מ-Supabase (`storiesList`)
- בחירת נושא דרך `Autocomplete`: "תגובה על סיפור" או "אחר"
  - "תגובה על סיפור" — מציג `Autocomplete` נוסף לבחירת סיפור
  - "אחר" — מציג שדה טקסט חופשי לנושא
- תגובות משורשרות מוסתרות כברירת מחדל — כפתור "תגובות (N)"
- ממוינות כרונולוגית (ישן לחדש)
- כפתור "השיבו" מוצג בתחתית התגובה, לחיצה גוללת לטופס ומציגה "משיב/ה לתגובה של [שם]"
- בעת השבה — שדות נושא מוסתרים, מוצג שם הנמען עם כפתור ביטול
- צ'קבוקס "שלחו לי עדכון במייל" בטופס
- ליד שדה המייל: "המייל לא יוצג באתר"
- ספינר + כיבוי כפתור בזמן שליחה
- הודעת הצלחה: "התגובה תפורסם לאחר אישור מנהל האתר"
- ספירת תווים בשדה תוכן התגובה (500 תווים)
- שמירת טיוטאה ב-localStorage (שדות טקסט, שם, מייל)
- Optimistic UI: תגובה מוצגת מידית עם תגית "ממתין לאישור" לפני קבלת אישור מנהל
- אנימציית כניסה לתגובות חדשות דרך framer-motion

### הרשאות השבה
- נושא "אחר" (`story_id = null`) — כולם יכולים להשיב
- נושא סיפור — רק הכותב המקורי (`session.user.email === c.email`)

### עיצוב תגובות

| סוג | אווטאר | צבע רקע | תגית |
|---|---|---|---|
| משתמש (ראשי/משורשר) | CreateIcon סגול | לבן | — |
| מנהל משורשר | AutoStoriesIcon כתום | #fffbf0 | badge כתום "מנהלת" |

### CommentsManager (מנהל)
- עיצוב זהה ל-CommentPage
- מציג **כל** התגובות הראשיות (ללא סינון סטטוס)
- כל תגובה ראשית: Chip סטטוס + שם + תאריך + מייל + נושא + תוכן + כפתורי אשר/דחה/השב
- תגובות משורשרות ממוינות כרונולוגית (ישן לחדש)
- תגובות משורשרות של **משתמש**: Chip סטטוס + כפתורי אשר/דחה
- תגובות משורשרות של **מנהל**: badge כתום `{name} | מנהלת` בלבד, ללא כפתורי ניהול
- כפתור "השב" פותח `Collapse` עם `TextField` לתגובת מנהל
- שם המנהל נשלף מטבלת `users` לפי session בעת טעינה

---

## עמוד About

- טקסט סטטי hardcoded — אין קריאה ל-Supabase
- חלוקה לפסקאות עם כותרת (`subtitle1`) בצבע primary
- ציטוט פותח עם קו צד (`borderRight`) ורקע עדין
- RTL: `direction: rtl` ב-`sx`, `textAlign: right` + `unicodeBidi: plaintext` ב-inline `style` (עקיפת stylis-plugin-rtl)

---

## מאחורי הקלעים

### BehindTheScenes (ציבורי — `/behind/:id`)
- נטען מטבלת `behind_the_scenes` לפי `story_id` מה-URL
- רקע כהה `#0d0d0d` — ניגוד ויזואלי לשאר האתר
- מציג: כותרת, ציטוט פותח (`tagline`) עם קו זהב, תוכן חופשי (`content`), תאריך כתיבה
- אם אין רשומה — מוצג "תוכן בקרוב..."
- כפתור חזרה לדף הבית

### BehindManager (מנהל בלבד — `/manage-behind`)
- רקע כהה זהה ל-BehindTheScenes
- רשימת פריטים עם hover glow זהב
- כפתורי צפייה / עריכה / מחיקה לכל פריט
- דיאלוג הוספה/עריכה עם 4 שדות: בחירת סיפור (dropdown), ציטוט, תוכן (8 שורות), תאריך
- בחירת סיפור ממלאת `story_title` אוטומטית
- גלילה ללא scrollbar (מוסתר דרך `useEffect` שמוסיף `<style>` זמני)

### טבלת `behind_the_scenes`

**מבנה:**
```js
{ id, story_id, story_title, tagline, content, written_at }
```

**קריאות:**

| פעולה | מתבצע ב | תיאור |
|---|---|---|
| `select * where story_id = :id` | BehindTheScenes | טעינת פריט לפי סיפור |
| `select * order by id` | BehindManager | טעינת כל הפריטים לניהול |
| `insert` | BehindManager.handleSave | הוספת פריט חדש |
| `update` | BehindManager.handleSave | עדכון פריט קיים |
| `delete` | BehindManager.handleDelete | מחיקת פריט |

**RLS Policies:**
```sql
CREATE TABLE behind_the_scenes (
  id bigint generated always as identity primary key,
  story_id bigint references stories(id) on delete cascade,
  story_title text,
  tagline text,
  content text,
  written_at date
);

CREATE POLICY "anyone can read behind_the_scenes"
  ON behind_the_scenes FOR SELECT USING (true);

CREATE POLICY "admin can manage behind_the_scenes"
  ON behind_the_scenes FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE behind_the_scenes ENABLE ROW LEVEL SECURITY;
```

---

## FileManager (ניהול סיפורים)

- עיצוב בסגנון CommentPage — כרטיסי Box לבנים עם צל
- אווטאר: עיגול כחול עם `AutoStoriesIcon`
- Chip DOCX (ירוק) — לחיצה פותחת ב-Office Viewer
- Chip PDF (כתום-אדום) — לחיצה פותחת ישירות בדפדפן
- כפתורי עריכה/מחיקה (`EditIcon` / `DeleteIcon`)
- דיאלוג הוספה/עריכה: שדה כותרת + העלאת DOCX + העלאת PDF
- Realtime subscription על טבלת `stories` — רשימת הסיפורים מתעדכנת אוטומטית בכל שינוי
- **חשוב:** יש להפעיל Realtime על טבלת `stories` ב-Supabase Dashboard תחת **Database → Replication**

---

## Edge Functions (Supabase)

### `notify-reply`
- מופעל לאחר הוספת תגובה משורשרת
- בודק אם לתגובה ההורה יש `email_updates = true` וכתובת מייל
- שולח מייל דרך EmailJS API (server-side)

### `send-otp`
- מופעל בעת התחברות מנהל
- מקבל `{ email, otpCode, expireTime }`
- שולח מייל OTP דרך EmailJS API עם template נפרד (`EMAILJS_OTP_TEMPLATE_ID`)

---

## משתני סביבה נדרשים

### Frontend (`.env`)

```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_ADMIN_EMAIL=
REACT_APP_ADMIN_PASSWORD=
```

### Edge Function Secrets ב-Supabase
ב-Supabase Dashboard → Edge Functions → Secrets יש להגדיר:

```
MY_SUPABASE_URL=
MY_SERVICE_ROLE_KEY=
EMAILJS_SERVICE_ID=
EMAILJS_TEMPLATE_ID=          # לשליחת notify-reply
EMAILJS_OTP_TEMPLATE_ID=      # לשליחת OTP למנהל
EMAILJS_PUBLIC_KEY=
EMAILJS_PRIVATE_KEY=
SITE_URL=http://localhost:3000   # או דומיין מלא ב-production
```
