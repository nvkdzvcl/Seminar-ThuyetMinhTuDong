export function LoadingSpinner({ text = 'Đang tải...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      <p className="mt-3 text-sm text-gray-500">{text}</p>
    </div>
  );
}