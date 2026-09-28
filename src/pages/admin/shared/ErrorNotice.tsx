export function ErrorNotice({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="admin-error" role="alert">
      <p>{message}</p>
      {retry && <button onClick={retry}>Try again</button>}
    </div>
  );
}
