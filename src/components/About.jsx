import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { Box, Container, Divider, Typography } from '@mui/material';
import React from 'react';

const rtlSx = { direction: 'rtl' };
const rtlStyle = { textAlign: 'right', unicodeBidi: 'plaintext' };

const Section = ({ title, children }) => (
  <Box sx={{ mb: 4 }}>
    {title && (
      <Typography variant="subtitle1" style={rtlStyle} sx={{ fontWeight: 700, color: '#c8860a', mb: 1, ...rtlSx }}>
        {title}
      </Typography>
    )}
    <Typography variant="body1" style={rtlStyle} sx={{ lineHeight: 2, color: '#7a5c3a', ...rtlSx }}>
      {children}
    </Typography>
  </Box>
);

const About = () => (
  <Box sx={{ bgcolor: '#f5ede3', minHeight: '100vh', pt: { xs: 10, sm: 11 }, pb: 6 }}>
  <Container maxWidth="sm" sx={{ pb: 6 }}>

    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, mb: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#3b2008' }}>אודות</Typography>
      <AutoStoriesIcon sx={{ color: '#c8860a', fontSize: 36 }} />
    </Box>
    <Box sx={{ width: 48, height: 3, bgcolor: '#c8860a', borderRadius: 2, mb: 3 }} style={{ marginRight: 0, marginLeft: 'auto' }} />

    <Box sx={{
      borderRight: '4px solid #c8860a',
      pr: 2, pl: 1, py: 1, mb: 4,
      bgcolor: 'rgba(200,134,10,0.06)',
      borderRadius: '0 8px 8px 0',
      ...rtlSx
    }}>
      <Typography variant="body1" style={rtlStyle} sx={{ fontStyle: 'italic', lineHeight: 2, color: '#5c3a1e', ...rtlSx }}>
        האתר הזה נוצר בעקבות כמה טריגרים. בלי הדברים שקרו לי, יכול להיות שלא הייתם קוראים את השורות הללו.
        וגם אם הייתם מנסים, כתובת הקישור הזו פשוט לא הייתה קיימת.
      </Typography>
    </Box>

    <Divider sx={{ mb: 4, borderColor: 'rgba(200,134,10,0.2)' }} />

    <Section title="אז איך הכל התחיל?">
      יצאתי לעולם לאחר שסיימתי לימודי הנדסת תוכנה, מנסה את מזלי בשליחת קורות חיים עלובים שנולדו לקראת סיום הלימודים.
      לא שיצא מהעליבות הזו משהו, אבל בינתיים, כדי לשרוד, התחלתי לעבוד בעבודות מזדמנות.
      לאט לאט הבנתי שהעבודות המזדמנות יישארו זמינות, בעוד שהעבודה ה"אמיתית" רק מתרחקת ממני יותר ויותר.
      ואחרי כמעט שנה הבנתי שצריך לעשות משהו מעבר לשליחת קורות חיים — וחברה יעצה לי לבנות בית לסיפורים שלי.
    </Section>

    <Section title="מאיפה הסיפורים הגיעו?">
      את שיעורי ספרות והבעה שנאתי כמה שיכלתי וכנראה שאשנא לעד. הציונים שקיבלתי לא עברו את אחוז החסימה,
      ובשלב מסוים גם הפסיקו לעניין אותי. אבל החיים, כידוע, אוהבים להפתיע.
      בגיל 16 מצאתי את עצמי עם עיפרון שפיץ על דף דפדפת A4 — ופשוט כותבת.
      עד היום זכורה לי הסיטואציה והתנוחה בה ישבתי וכתבתי.
      <br />
      מאז, שפת הכתיבה שלי התפתחה והפכה למשופשפת יותר. בגיל 19 התחלתי לכתוב ספר.
      הוא עדיין בכתיבה, אבל כבר מגיע לכ-20 פרקים וכ-125 עמודי A4.
      <br />
      <br />
      כשפרצה המלחמה הארורה הפסקתי לכתוב. הרגש שלי כאילו נעצר, ולא הצלחתי להוציא אותו החוצה.
      כך עברו שישה חודשים — עד שהרגש פרץ החוצה ובבת אחת.
      ביום אחד נוצר הקטע הראשון שלי. ובעקבותיו, עוד ועוד.
      <br />
      <br />
      <br />
      כך נוצר האתר הזה. שילוב של שכל ורגש, ראליות עם הומניות.
      אני מקווה שתאהבו לא רק את הסיפורים שנכתבו בזמנים הזויים ובשעות שלא הייתם מעלים על דעתכם,
      אלא גם את האתר עצמו — שעד שהגיע למה שהוא היום לקח לו לא מעט זמן.
      כמה טלטלות ספג, כמה מעברים בין בסיסי נתונים הוא חווה, ובשלב מסוים נכנס גם ה-AI לתמונה
      ועזר לו לקפוץ קדימה בצורה שלא דמיינתי.
    </Section>

    <Divider sx={{ mb: 3, borderColor: 'rgba(200,134,10,0.2)' }} />

    <Typography variant="body1" style={rtlStyle} sx={{ fontWeight: 600, lineHeight: 2, color: '#3b2008', ...rtlSx }}>
      אז נשאר לי רק להגיד תודה לכל מי שפרגן, דחף, והאמין שהדבר הזה יגיע לאיפה שהוא נמצא היום. 🙏
    </Typography>

  </Container>
  </Box>
);

export default About;
