import { PageTitle } from "@/components/shared/PageTitle";
import SalesmenTable from "./_components/SalesmenTable";

export default function SalesmenPage() {
  return (
    <div>
      <PageTitle title="Salesman" subtitle="Kelola salesman" />
      <SalesmenTable />
    </div>
  );
}
