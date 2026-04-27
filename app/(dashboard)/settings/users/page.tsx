import { PageTitle } from "@/components/shared/PageTitle";
import UserTable from "./_components/UserTable";

export default function UsersPage() {
  return (
    <div>
      <PageTitle title="User" subtitle="Kelola pengguna sistem" />
      <UserTable />
    </div>
  );
}
