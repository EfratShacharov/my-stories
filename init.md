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
│   │   ├── Home.jsx           # דף ראשי – רשימת סיפורים עם תקציר
│   │   ├── StoryPage.jsx      # קריאת סיפור + טופס תגובה
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
├── .env                       # משתני סביבה (Supabase URL, KEY, ADMIN_EMAIL)
└── package.json
```

---

## טכנולוגיות

| טכנולוגיה | גרסה | שימוש |
|---|---|---|
| React | 19 | UI framework |
| React Router DOM | 7 | ניווט בין עמודים |
| MUI (Material UI) | 7 | רכיבי UI |
| Emotion | 11 | CSS-in-JS (RTL support) |
| stylis-plugin-rtl | 2 | תמיכה בכיוון RTL |
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
| `select * order by created_at desc` | CommentsContext, CommentsManager | טעינת כל התגובות |
| `insert` | CommentsContext.addComment | הוספת תגובה חדשה |
| `update { status }` | CommentsManager.updateStatus | אישור / דחיית תגובה |
| `insert` (is_admin: true) | CommentsManager.sendReply | תגובת מנהל |

**מבנה רשומת comment:**
```js
{
  id, name, email,
  story_id,       // null אם לא סיפור
  story_title,    // נושא חופשי או שם סיפור
  comment,
  is_admin,       // boolean
  status,         // "pending" | "approved" | "rejected"
  parent_id,      // null = תגובה ראשית, id = תגובת מנהל
  created_at
}
```

### טבלת `users`

| פעולה | מתבצע ב | תיאור |
|---|---|---|
| `select name, is_admin` | App.js.loadUserData | קריאת פרטי משתמש |
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
├── CommentsProvider (Context)
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
- **comments** – מנוהל ב-`CommentsContext` (Context API), נטען פעם אחת בהתחלה
- **RTL** – מוגדר גלובלית דרך MUI ThemeProvider + stylis-plugin-rtl

### זרימת אימות

```
משתמש רגיל:  כניסה → signInWithPassword → session
מנהל:        כניסה → signInWithPassword → שליחת OTP דרך EmailJS → אימות קוד → session + isAdmin=true
```

### הרשאות

- **אורח** – קריאת סיפורים, הגשת תגובה (עם שם + מייל ידני)
- **משתמש מחובר** – הגשת תגובה (שם ומייל נלקחים מה-DB אוטומטית)
- **מנהל** – כל האמור + ניהול תגובות (אישור/דחייה/תשובה) + ניהול קבצים

### ניהול תגובות

- תגובות חדשות נכנסות בסטטוס `pending`
- תגובות מנהל נכנסות ישירות בסטטוס `approved`
- בתצוגה ציבורית מוצגות רק תגובות `approved` עם `parent_id = null` + תגובות המנהל שלהן

---

## משתני סביבה נדרשים (`.env`)

```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_ADMIN_EMAIL=
```
