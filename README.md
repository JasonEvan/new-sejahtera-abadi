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

### Keyboard Shortcuts

- On `/edit/sales`, press **F1** to open **Check Harga**, including while an input is focused. Select a client and invoice first, just as when using the button. The shortcut prevents the browser's default F1 help action and is removed when leaving the page.
- The `/edit/sales` **Check Harga** modal uses 85% of the viewport height with a scrollable body. Search results are ordered by sale date, newest first; each item still shows its latest price for the selected client.
- Results matching an item name in the currently edited invoice show **Ada di nota aktif**. The marker follows the unsaved item list, updating when items are added or removed; similarly named items are not marked unless their full names match.

### Editing Receivables

- On `/edit/receivables`, adding an invoice preserves its full invoice value for display and calculates the remaining balance from its current outstanding balance minus the payment being added. **Add Full Payment** pays only the outstanding balance, including for invoices with earlier payments.
- The sales invoice menu (`GET /api/sales?for_menu=true`) includes `id`, `invoice_number`, `invoice_value`, and `balance_due`.

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

### Login Approval Email (Resend)

Login requests from untrusted devices send an approval email to `OWNER_EMAIL`
through [Resend](https://resend.com/docs/send-with-nextjs).
Configure these variables in `.env` and in your deployment environment:

```dotenv
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL="POS Security <security@your-domain.com>"
OWNER_EMAIL=admin@example.com
NEXT_PUBLIC_APP_URL=https://your-app.example.com
```

- Create an API key with permission to send emails in Resend.
- Verify the sender domain in [Resend Domains](https://resend.com/domains)
  and use an address on that domain for `RESEND_FROM_EMAIL`. A Gmail address
  cannot be used as the sender; `OWNER_EMAIL` can still be a Gmail address.
- For limited testing, `POS Security <onboarding@resend.dev>` can send only
  to the email address associated with your Resend account.
- Set `NEXT_PUBLIC_APP_URL` to the application's reachable URL so the
  approve, remember-device, and reject links work for the owner.
- SMTP credentials are no longer used. Restart the application after changing
  environment variables.

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
