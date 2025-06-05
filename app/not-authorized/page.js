// app/not-authorized/page.js
export default function NotAuthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-red-500">
          🚫 Access Denied
        </h1>
        <p className="text-gray-600">
          You do not have permission to access this page.
        </p>
      </div>
    </div>
  );
}
