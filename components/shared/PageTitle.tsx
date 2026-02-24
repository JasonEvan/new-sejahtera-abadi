export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight text-balance mb-1">
        {title}
      </h1>
      <p className="text-muted-foreground text-lg">{subtitle}</p>
    </>
  );
}
