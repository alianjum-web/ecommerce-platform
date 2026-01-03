export function Row({ label, value, success = false }: any) {
  return (
    <div className={`flex justify-between ${success ? "text-success" : ""}`}>
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

