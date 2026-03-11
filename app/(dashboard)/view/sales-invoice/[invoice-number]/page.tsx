import SalesInvoiceDetailContent from "./_components/SalesInvoiceDetailContent";

export default async function SalesInvoiceDetailPage({
  params,
}: {
  params: Promise<{ "invoice-number": string }>;
}) {
  const { "invoice-number": invoiceNumber } = await params;
  return (
    <SalesInvoiceDetailContent
      invoiceNumber={decodeURIComponent(invoiceNumber)}
    />
  );
}
