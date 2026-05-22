export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="h-9 w-44 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-72 max-w-full bg-gray-200 rounded mt-2 animate-pulse" />
      </div>
      <div className="h-10 w-56 bg-gray-200 rounded-lg animate-pulse mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3 animate-pulse"
          >
            <div className="h-5 w-3/4 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
            <div className="h-4 w-1/3 bg-gray-200 rounded mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
