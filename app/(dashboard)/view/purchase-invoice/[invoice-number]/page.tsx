import PurchaseInvoiceDetailContent from "./_components/PurchaseInvoiceDetailContent";

export default async function PurchaseInvoiceDetailPage({
  params,
}: {
  params: Promise<{ "invoice-number": string }>;
}) {
  const { "invoice-number": invoiceNumber } = await params;
  return (
    <PurchaseInvoiceDetailContent
      invoiceNumber={decodeURIComponent(invoiceNumber)}
    />
  );
}
