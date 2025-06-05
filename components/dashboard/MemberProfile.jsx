// components/dashboard/MemberProfile.jsx
// "use client";

// import { UserButton, useUser } from "@clerk/nextjs";

// const ALLOWED_IDS = [
//   "user_2xYcBxcVUeYD9RmUOhCdEErW4ef",
//   "user_2xbPOkF9DIJJQFVuQk0QbjBw5bC",
// ];

// export default function MemberProfile() {
//   const { user, isLoaded } = useUser();

//   if (!isLoaded) return null;

//   const userId = user?.id;
//   const email = user?.emailAddresses?.[0]?.emailAddress;

//   const isAuthorized = ALLOWED_IDS.includes(userId);

//   return (
//     <div className="flex items-center justify-between p-4 bg-base-200 rounded">
//       <div className="flex items-center gap-2">
//         <UserButton afterSignOutUrl="/" />
//         <p className="text-sm text-gray-700">{email}</p>
//       </div>

//       {!isAuthorized && (
//         <p className="text-sm text-red-600">
//           🚫 Not authorized to view admin content
//         </p>
//       )}
//     </div>
//   );
// }
