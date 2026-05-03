# Sejahtera Abadi Management System

A modern, full-stack management application built with Next.js, designed for efficient business operations, inventory tracking, and sales management.

## 🚀 Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand), [TanStack Query](https://tanstack.com/query/latest)
- **Authentication**: JWT-based with Trusted Device verification
- **Tables**: [TanStack Table](https://tanstack.com/table/latest)
- **Forms**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation
- **Reporting**: [ExcelJS](https://github.com/exceljs/exceljs) for exports, [jsPDF](https://github.com/parallax/jsPDF) for PDF generation

## ✨ Key Features

- **Dashboard**: Real-time overview of business metrics and statistics.
- **Client Management**: Maintain a comprehensive database of clients and their transaction history.
- **Inventory/Stock**: Track stock levels, manage purchases, and monitor product movements.
- **Sales & Purchases**: Streamlined workflow for recording sales and procurement.
- **Returns Management**: Handle product returns efficiently.
- **Salesmen Tracking**: Monitor salesmen performance and assignments.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for different user roles.
- **Trusted Device Auth**: Enhanced security via device fingerprinting and email verification.
- **Data Export/Backup**: Export reports to Excel and PDF formats, with backup capabilities.

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+ 
- PostgreSQL database

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd new-sejahtera-abadi
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. **Database Setup:**
   Generate and run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Seed Initial Data:**
   ```bash
   npm run db:seed
   ```

6. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

- `app/`: Next.js App Router (pages and API routes)
- `components/`: Reusable UI components (Shadcn + custom)
- `drizzle/`: Database schema, migrations, and seeders
- `hooks/`: Custom React hooks
- `lib/`: Utility libraries and configurations
- `modules/`: Feature-specific logic and components
- `stores/`: Zustand state stores
- `utils/`: Helper functions

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📝 License

This project is private and confidential.
