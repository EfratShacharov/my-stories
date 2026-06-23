# תיעוד פרויקט my-stories

## מבנה קבצים

```
my-stories/
├── public/                    # קבצים סטטיים
├── src/
│   ├── components/
│   │   ├── Stories.jsx        # ריק — הסיפורים עברו לטבלת Supabase
│   │   ├── Home.jsx           # דף ראשי – רשימת סיפורים + טופס תגובה לכל סיפור
│   │   ├── StoryPage.jsx      # קריאת סיפור + טופס תגובה + progress bar אינטראקטיבי
│   │   ├── CommentPage.jsx    # עמוד תגובות ציבוריות + טופס הגשה + תגובות משורשרות
│   │   ├── CommentsManager.jsx# ניהול תגובות (מנהל בלבד) — עיצוב זהה ל-CommentPage
│   │   ├── FileManager.jsx    # ניהול סיפורים (מנהל בלבד) — Supabase Storage
│   │   ├── Navbar.jsx         # ניווט עליון
│   │   ├── AuthModal.jsx      # מודל התחברות / הרשמה / OTP
│   │   └── AdminLogin.jsx     # (קיים, לא בשימוש פעיל)
│   ├── context/
│   │   └── CommentsContext.jsx# Context גלובלי לתגובות + Realtime subscription
│   ├── supabase.js            # אתחול Supabase client
│   ├── App.js                 # נתב ראשי + ניהול session
│   └── index.js               # נקודת כניסה
├── .env                       # משתני סביבה
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
| Supabase JS | 2 | Backend: auth + database + storage + Realtime |
| EmailJS | 3 | שליחת OTP במייל למנהל |
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
| `insert` | CommentsContext.addComment | הוספת תגובה חדשה |
| `update { status }` | CommentsManager.updateStatus | אישור / דחיית תגובה |
| `insert` (is_admin: true, status: approved) | CommentsManager.sendReply | תגובת מנהל |
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
  created_at
}
```

**RLS policies על `comments`:**
- `SELECT` – משתמשים רגילים רואים רק `status = 'approved'`; מנהל רואה הכל
- `INSERT` – מותר ל-`anon` ו-`authenticated`
- `UPDATE` – מותר ל-`authenticated` בלבד

**חשוב:** יש לוודא שה-Realtime מופעל על טבלת `comments` ב-Supabase Dashboard תחת **Database → Replication**

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
├── CommentsProvider (Context – comments, addComment, fetchComments)
├── Navbar (isAdmin, session, userName)
└── Routes
    ├── /                → Home (session, isAdmin)
    ├── /story/:id       → StoryPage (session, isAdmin)
    ├── /comments        → CommentPage (isAdmin, session)
    ├── /files           → FileManager (מנהל בלבד)
    └── /manage-comments → CommentsManager (מנהל בלבד)
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
| מנהל | הכל + אישור/דחייה/תשובה לתגובות + ניהול סיפורים |

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

### עיצוב טקסט הסיפור
- שורות רגילות (עברית + מספרים + פיסוק): `lineHeight: 1.75`, `textAlign: right`, `direction: rtl`, `ml: auto`, `maxWidth: 65ch`
- שורות עם סימנים מיוחדים (לא עברית/מספרים/פיסוק): `textAlign: center`
- שורה ריקה = מעבר פסקה (`height: 1.2em`)
- `isSpecialLine` — בודק אם השורה מכילה תווים שאינם: עברית, ספרות, `,`, `.`, `!`, `?`, `'`, `"`, `(`, `)`, `-`

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

- סיפורים נטענים מ-Supabase: `select id, title, docx_url`
- תקציר אוטומטי מ-DOCX דרך `mammoth` (5 שורות, 17 מילים לשורה)
- כפתור "הוסף תגובה" פותח `Collapse` עם טופס לכל סיפור בנפרד
- משתמש מחובר — שדות שם/מייל מוסתרים

---

## ניהול תגובות

### CommentPage (ציבורי)
- מוצגות רק תגובות ראשיות `approved` עם `parent_id = null`
- רשימת סיפורים לטופס נטענת מ-Supabase (`storiesList`)
- תגובות משורשרות מוסתרות כברירת מחדל — כפתור "תגובות (N)"
- ממוינות כרונולוגית (ישן לחדש)
- כפתור "השיבו" מוצג בתחתית התגובה (אחרי הCollapse)
- לחיצה גוללת לטופס ומציגה "משיב/ה לתגובה של [שם]"

### הרשאות השבה
- נושא "אחר" (`story_id = null`) — כולם יכולים להשיב
- נושא סיפור — רק הכותב המקורי (`session.user.email === c.email`)

### עיצוב תגובות

| סוג | אווטאר | צבע רקע | תגית |
|---|---|---|---|
| משתמש (ראשי/משורשר) | CreateIcon כחול | לבן | — |
| מנהל משורשר | AutoStoriesIcon כתום | #fff8f0 | badge כתום "מנהלת" |

### CommentsManager (מנהל)
- עיצוב זהה ל-CommentPage
- כל תגובה: Chip סטטוס + שם + תאריך + מייל + נושא + תוכן
- תגובות משורשרות ממוינות כרונולוגית
- תגובות משורשרות של **משתמש**: Chip סטטוס + כפתורי אשר/דחה
- תגובות משורשרות של **מנהל**: badge כתום בלבד
- כפתור "השב" פותח textarea לתגובת מנהל

---

## FileManager (ניהול סיפורים)

- עיצוב בסגנון CommentPage — כרטיסי Box לבנים עם צל
- אווטאר: עיגול כחול עם `AutoStoriesIcon`
- Chip DOCX (ירוק) — לחיצה פותחת ב-Office Viewer
- Chip PDF (כתום-אדום) — לחיצה פותחת ישירות בדפדפן
- כפתורי עריכה/מחיקה (`EditIcon` / `DeleteIcon`)
- דיאלוג הוספה/עריכה: שדה כותרת + העלאת DOCX + העלאת PDF
- שדה "שם תצוגה" הוסר
- Realtime subscription על טבלת `stories` — רשימת הסיפורים מתעדכנת אוטומטית בכל שינוי
- **חשוב:** יש להפעיל Realtime על טבלת `stories` ב-Supabase Dashboard תחת **Database → Replication**

---

## משתני סביבה נדרשים (`.env`)

```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_ADMIN_EMAIL=
REACT_APP_ADMIN_PASSWORD=
```
