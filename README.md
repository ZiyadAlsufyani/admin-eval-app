# تقييم الإداريين (Admin Evaluation App)

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-1C1C1C?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A specialized **School Performance Evaluation System** designed for educational institutions, specifically optimized for the Saudi Arabian school environment. This mobile-first **Progressive Web App (PWA)** streamlines the feedback loop between school principals and staff members.

---

## 🌟 Key Features

### 🏢 Institutional Management
*   **Role-Based Access Control**: Distinct environments for Principals (Admins) and Staff members.
*   **Staff Onboarding**: Invite staff seamlessly via **Email** or **WhatsApp** broadcast links.
*   **School Verification**: A "Waiting Room" system for verifying new school registrations.

### 📊 Performance Tracking
*   **Evaluation Workflow**: Principals can initiate evaluations, save drafts, and finalize reports.
*   **Evidence Collection**: Staff can upload documents and evidence directly through the portal.
*   **Interactive Dashboards**: Real-time performance tracking with visual analytics using Recharts.

### 📅 Localized Context
*   **Saudi Academic Calendar**: Integrated support for the Sunday-Thursday work week.
*   **Week-of-Term Tracking**: Automatically calculates and displays the current academic week.

### 📱 Modern Experience
*   **PWA Ready**: Installable on iOS/Android and works with offline capabilities.
*   **Responsive Design**: A premium, tactile UI optimized for touch interaction and high-density screens.

---

## 🛠️ Tech Stack

- **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Backend-as-a-Service**: [Supabase](https://supabase.com/) (Auth, Database, Storage)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: CSS Transitions & Framer Motion (where applicable)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm
- A Supabase account and project

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/ZiyadAlsufyani/admin-eval-app.git
    cd admin-eval-app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

---

## 📁 Project Structure

```text
src/
├── api/            # API services and Supabase interactions
├── components/     # Reusable UI components (Shared/Layout)
├── constants/      # App-wide constants and config
├── features/       # Feature-based modules (Auth, Dashboard, Evaluations, Staff)
│   ├── auth/       # Authentication screens and logic
│   ├── dashboard/  # Role-specific dashboard views
│   ├── evaluations/# Evaluation forms and lists
│   └── staff/      # Staff management and profiles
├── lib/            # Third-party library initializations (Supabase, etc.)
├── types/          # Global TypeScript definitions
└── utils/          # Helper functions and calendar logic
```

---

## 📜 Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles TypeScript and builds the production bundle.
- `npm run lint`: Runs ESLint for code quality checks.
- `npm run preview`: Previews the production build locally.

---

## 📄 License
This project is private and for internal use within the designated educational institutions.
