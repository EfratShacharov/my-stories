# תיעוד פרויקט my-stories

## מבנה קבצים

```
my-stories/
├── public/
│   └── stories/              # קבצי הסיפורים (docx + pdf)
│       ├── Lo_Mevatrim.docx / .pdf
│       ├── Eifo_Hem.docx / .pdf
│       ├── Halevai_Shenizkeh.docx / .pdf
│       └── Rak_Im.docx / .pdf
├── src/
│   ├── components/
│   │   ├── Stories.jsx        # מערך סטטי של סיפורים (id, title, docx, pdf)
│   │   ├── Home.jsx           # דף ראשי – רשימת סיפורים עם תקציר אוטומטי מ-DOCX
│   │   ├── StoryPage.jsx      # קריאת סיפור + טופס תגובה מהירה
│   │   ├── CommentPage.jsx    # עמוד תגובות ציבוריות + טופס הגשה
│   │   ├── CommentsManager.jsx# ניהול תגובות (מנהל בלבד)
│   │   ├── FileManager.jsx    # ניהול קבצים (מנהל בלבד, localStorage)
│   │   ├── Navbar.jsx         # ניווט עליון
│   │   ├── AuthModal.jsx      # מודל התחברות / הרשמה / OTP
│   │   └── AdminLogin.jsx     # (קיים, לא בשימוש פעיל)
│   ├── context/
│   │   └── CommentsContext.jsx# Context גלובלי לתגובות
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
| @mui/icons-material | 7 | אייקונים (CreateIcon, AutoStoriesIcon וכו') |
| Emotion | 11 | CSS-in-JS |
| stylis-plugin-rtl | 2 | תמיכה גלובלית בכיוון RTL |
| Supabase JS | 2 | Backend: auth + database |
| EmailJS | 3 | שליחת OTP במייל למנהל |
| mammoth | 1 | המרת קבצי DOCX לטקסט |
| framer-motion | 12 | אנימציות |
| Firebase | 12 | מותקן אך לא בשימוש |

---

## קריאות ל-Supabase (נקודות קצה)

### טבלת `comments`

| פעולה | מתבצע ב | תיאור |
|---|---|---|
| `select * order by created_at desc` | CommentsContext.fetchComments | טעינת כל התגובות |
| `insert` | CommentsContext.addComment | הוספת תגובה חדשה |
| `update { status }` | CommentsManager.updateStatus | אישור / דחיית תגובה |
| `insert` (is_admin: true, status: approved) | CommentsManager.sendReply | תגובת מנהל |

**מבנה רשומת comment:**
```js
{
  id, name, email,
  story_id,       // null אם לא סיפור ספציפי
  story_title,    // נושא חופשי או שם סיפור
  comment,
  is_admin,       // boolean
  status,         // "pending" | "approved" | "rejected"
  parent_id,      // null = תגובה ראשית, id = תגובת מנהל
  created_at
}
```

**Supabase RLS policies על `comments`:**
- `SELECT` – משתמשים רגילים רואים רק `status = 'approved'`; מנהל רואה הכל
- `INSERT` – מותר ל-`anon` ו-`authenticated` (WITH CHECK: true)
- `UPDATE` – מותר ל-`authenticated` בלבד

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

### Supabase Auth

| פעולה | תיאור |
|---|---|
| `signInWithPassword` | התחברות רגילה |
| `signUp` | הרשמה |
| `signOut` | התנתקות |
| `getSession` | בדיקת session קיים |
| `onAuthStateChange` | מאזין לשינויי auth |

---

## ארכיטקטורה כללית

### תרשים זרימה

```
App.js
├── CommentsProvider (Context – comments, addComment, fetchComments)
├── Navbar (isAdmin, session, userName)
└── Routes
    ├── /                → Home
    ├── /story/:id       → StoryPage
    ├── /comments        → CommentPage
    ├── /files           → FileManager (מנהל בלבד)
    └── /manage-comments → CommentsManager (מנהל בלבד)
```

### ניהול מצב

- **session / isAdmin / userName** – מנוהל ב-`App.js`, מועבר כ-props
- **comments** – מנוהל ב-`CommentsContext`:
  - נטען פעם אחת עם `fetchComments` ב-useEffect
  - `fetchComments` חשופה ב-Context ומופעלת אחרי כל שינוי (אישור, דחייה, תגובת מנהל) לעדכון מיידי
- **RTL** – מוגדר גלובלית דרך MUI ThemeProvider + stylis-plugin-rtl

### זרימת אימות

```
משתמש רגיל:  כניסה → signInWithPassword → session
מנהל:        כניסה → signInWithPassword → שליחת OTP דרך EmailJS → אימות קוד → session + isAdmin=true
```

### הרשאות

| משתמש | יכולות |
|---|---|
| אורח | קריאת סיפורים, הגשת תגובה עם שם + מייל ידני |
| משתמש מחובר | הגשת תגובה (שם ומייל נלקחים מה-DB אוטומטית) |
| מנהל | הכל + אישור/דחייה/תשובה לתגובות + ניהול קבצים |

### ניהול תגובות

- תגובות חדשות נכנסות בסטטוס `pending`
- תגובות מנהל נכנסות ישירות בסטטוס `approved`
- בתצוגה ציבורית (`CommentPage`) מוצגות רק תגובות `approved` עם `parent_id = null` + תגובות המנהל שלהן
- בדף הניהול (`CommentsManager`) מוצגות **כל** התגובות עם סטטוס + אפשרויות פעולה
- לאחר כל פעולת מנהל נקרא `fetchComments` לעדכון מיידי בכל הדפים

### עיצוב תגובות

**CommentPage (ציבורי):**
- אווטאר `CreateIcon` (כחול) למשתמש, `AutoStoriesIcon` (כתום) למנהל
- שם + תאריך בפורמט `DD.MM.YYYY, HH:MM`
- נושא מתחת לשם
- תגובות מנהל עם badge כתום ו-`| מנהלת`

**CommentsManager (מנהל):**
- כרטיסי MUI עם סטטוס Chip (ירוק/אדום/כתום)
- תצוגה: סטטוס → שם + תאריך → מייל → נושא → תוכן
- פורמט תאריך: `(HH:MM ,DD.MM.YYYY)`
- כפתורי אשר / דחה / השב לכל תגובה

---

## משתני סביבה נדרשים (`.env`)

```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_ADMIN_EMAIL=
REACT_APP_ADMIN_PASSWORD=
```
