SIDE HUSTLE HUB - PROTOTYPE v2   (every file lives in this ONE folder, no sub-folders)

PAGES (what visitors see)
index.html      home: hero, how it works, fees + calculator, latest listings, FAQ, contact
browse.html     search, filter by category, sort, apply
join.html       sign up (with proof of age) and log in
dashboard.html  member area: overview, post, my side hustles, applications, payments, profile
admin.html      admin only: approve members, view proof of age, record EcoCash payouts

LOOK AND FEEL
styles.css      colours and layout (change the colours at the very top)
motion.css      all animations

SCRIPTS (what makes buttons work)
common.js       shared tools: server calls, menu, pop-ups, listing cards
effects.js      scroll reveal, tilt, ripple, counters, cursor glow
home.js  browse.js  join.js  dashboard.js  admin.js    one per page

DATA AND SETTINGS (JSON files)
config.json         PUBLIC words and contacts: brand, phones, categories, menu
faq.json            the FAQ questions and answers
testimonials.json   testimonials (replace the [EDIT HERE] ones with real ones)
settings.json       PRIVATE: admin email, fee percentage, minimum age, port
database.json       the database. Created automatically. Never shared with visitors.
proof_*.jpg/png     proof-of-age photos. Created automatically. Admin-only.

server.js       the backend    start.bat   Windows double-click starter

HOW TO RUN
1. Install Node.js (LTS) from nodejs.org.
2. Windows: double-click start.bat.   Others: open a terminal here and run: node server.js
3. Open http://localhost:3000  (do NOT double-click index.html, the buttons need the server).
4. Sign up with jadengon6@gmail.com first. That account becomes the ADMIN.

TRY THE WHOLE JOURNEY
Sign up admin -> sign up a worker (second browser or private window) -> admin approves worker
-> admin posts a side hustle (role "Both") -> worker applies -> admin accepts -> "Mark done and pay"
-> Admin page > Payouts shows the 80% to send by EcoCash and your 20% -> "Mark as paid".

CHANGING THINGS
Fee 20% or minimum age: settings.json (restart the server) and config.json (so the words match).
Brand name, phone numbers, categories, menu: config.json.

LIMITS OF A PROTOTYPE
- EcoCash is not connected. You send money by hand and record the reference.
  Real automation needs a payment provider such as Paynow Zimbabwe.
- Netlify / Cloudflare Pages cannot run server.js. Use a Node host (e.g. Render, Railway)
  with a persistent disk for database.json and the proof photos.
- Before real users: HTTPS, password reset, privacy notice, and advice on storing ID photos of minors.
