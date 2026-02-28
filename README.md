# MultiSkills — Project Structure

```
src/
├── main.jsx                  # React entry point
├── App.jsx                   # Root component + router
├── context/
│   └── AuthContext.jsx       # Auth state (Supabase user session)
├── lib/
│   ├── supabase.js           # ✅ Supabase client — connected
│   └── classifySkill.js      # Anthropic AI classification call
├── pages/
│   ├── WelcomePage.jsx       # Landing screen
│   ├── AuthPage.jsx          # Login + Register
│   ├── HomePage.jsx          # Main skill input + buckets
│   ├── CategoryPage.jsx      # Skill list per category
│   └── SkillDetailPage.jsx   # Individual skill detail
├── components/
│   ├── Navbar.jsx            # Top bar with account icon
│   ├── AccountDrawer.jsx     # Slide-out user profile panel
│   ├── SkillInput.jsx        # Input + Analyze button
│   ├── SuggestionCard.jsx    # AI result + confirm/change
│   ├── CategoryBucket.jsx    # Category row with count
│   └── OverrideModal.jsx     # Category picker modal
└── styles/
    └── globals.css           # CSS variables + resets
```

## ✅ Supabase Connected
Project: https://cerlpvxuzyqbbylkrmmr.supabase.co
Auth: Email/Password + Google OAuth enabled

## Setup

1. Install deps:
   ```bash
   npm install
   ```

2. Run the SQL below in your Supabase project's **SQL Editor**:

   ```sql
   -- Skills table
   create table if not exists skills (
     id uuid default gen_random_uuid() primary key,
     user_id uuid references auth.users not null,
     skill_name text not null,
     ai_suggested_category text,
     final_category text not null,
     ai_reason text,
     created_at timestamptz default now()
   );

   -- Row Level Security: users only see their own skills
   alter table skills enable row level security;

   create policy "Users manage their own skills"
     on skills for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);
   ```

3. In your Supabase Dashboard → **Authentication → URL Configuration**, add:
   - Site URL: `http://localhost:3000` (dev) or your production URL
   - Redirect URL: `http://localhost:3000` (and your production URL)

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Google OAuth
Google OAuth is configured in Supabase. Make sure your Google Cloud Console OAuth app has:
- Authorized redirect URI: `https://cerlpvxuzyqbbylkrmmr.supabase.co/auth/v1/callback`

"# multiskills" 
