export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="h-9 w-36 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-96 max-w-full bg-gray-200 rounded mt-2 animate-pulse" />
      </div>
      <div className="h-4 w-44 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-3 animate-pulse"
          >
            <div className="w-16 h-16 rounded-full bg-gray-200" />
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
