export function ErrorNotice({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div
      className="my-[15px] flex items-center justify-between gap-3 rounded-[9px] border border-[#fa41644a] bg-[#fa416412] p-[15px] text-[#ff91a6]"
      role="alert"
    >
      <p>{message}</p>
      {retry && (
        <button
          className="inline-flex items-center justify-center gap-[7px] rounded-[7px] border border-[#393b47] bg-[#2c2e39] px-[15px] py-2.5"
          onClick={retry}
        >
          Try again
        </button>
      )}
    </div>
  );
}
