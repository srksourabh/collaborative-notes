# 📚 ClassNotes - Collaborative Note-Taking Platform

A modern, database-backed collaborative note-taking application built specifically for students.

## ✨ Features

- ✅ **User Authentication** - Secure signup/login with Supabase Auth
- ✅ **Class Management** - Create and join classes with invite codes
- ✅ **Subject Organization** - Organize notes by subject with custom colors/icons
- ✅ **Note Creation** - Create and manage notes with database persistence
- ✅ **Real-time Data** - All data synced with PostgreSQL database
- ✅ **Clean UI** - Modern, responsive interface built with Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works!)

### Setup (5 minutes)

1. **Install dependencies**:
```bash
npm install
```

2. **Set up Supabase**:
   - Create project at https://supabase.com
   - Run `database/schema.sql` in SQL Editor
   - Copy project URL and anon key

3. **Create .env.local**:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

4. **Run development server**:
```bash
npm run dev
```

5. **Open http://localhost:3000** ✅

## 📖 Documentation

- **SETUP_GUIDE.md** - Complete setup instructions
- **database/schema.sql** - Database schema with all tables

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 📊 Database Schema

- **users** - User profiles
- **classes** - Class information
- **class_members** - User-class relationships
- **subjects** - Subjects within classes
- **notes** - Note content
- **comments** - Discussion threads
- **note_images** - Image attachments
- **note_urls** - URL links
- **note_shares** - Sharing permissions
- **activity_logs** - Activity tracking
- **edit_history** - Change history
- **notifications** - User notifications

## 🎯 Usage

1. **Sign Up** - Create account with email and username
2. **Create/Join Class** - Start a new class or join with invite code
3. **Add Subjects** - Organize by subject (Math, Science, etc.)
4. **Create Notes** - Write and save notes
5. **Collaborate** - Share with classmates

## 🔐 Security

- Row Level Security (RLS) enabled
- Supabase Auth for authentication
- Secure API keys via environment variables
- All data encrypted in transit

## 📱 Responsive Design

- Works on desktop, tablet, and mobile
- Touch-friendly interface
- Optimized for all screen sizes

## 🐛 Troubleshooting

See **SETUP_GUIDE.md** for detailed troubleshooting steps.

Common issues:
- Missing .env.local file
- Database schema not applied
- Wrong environment variables

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

## 📝 License

MIT License - Feel free to use for your projects!

## 🤝 Contributing

Contributions welcome! This is an MVP with room for enhancement.

## 🎓 Perfect For

- Students in classes
- Study groups
- Collaborative learning
- Note sharing
- Educational institutions

---

**Built with ❤️ for students**
