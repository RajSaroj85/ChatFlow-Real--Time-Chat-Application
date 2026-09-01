import React from 'react';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const Navbar = ({ user }) => {
  const { logout } = useAuth();

  return (
    <nav className="bg-white shadow px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Menu className="w-6 h-6 text-gray-600 cursor-pointer" />
        <h1 className="text-xl font-bold text-gray-800">ChatFlow</h1>
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-gray-700">{user.fullName}</span>
          <img
            src={user.profileImage}
            alt={user.fullName}
            className="w-10 h-10 rounded-full"
          />
          <button
            onClick={logout}
            className="text-gray-600 hover:text-gray-800"
            title="Logout"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      )}
    </nav>
  );
};
