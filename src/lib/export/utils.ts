export const downloadFile = (
  filename: string,
  content: string | Blob,
  type: string,
): void => {
  // SSR 환경 체크
  if (typeof window === 'undefined') return;

  const blob =
    content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};
