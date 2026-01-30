import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiFolder,
  FiCheckSquare,
  FiUsers,
  FiSettings,
  FiPlus,
} from 'react-icons/fi';

const Sidebar = () => {
  const navItems = [
    { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/projects', icon: FiFolder, label: 'Projects' },
    { to: '/my-tasks', icon: FiCheckSquare, label: 'My Tasks' },
  ];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 z-40">
      <div className="flex flex-col h-full">
        {/* Create Button */}
        <div className="p-4">
          <NavLink
            to="/projects?create=true"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <FiPlus className="text-lg" />
            New Project
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="text-xl" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <hr className="my-4" />

          {/* Recent Projects */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Quick Access
            </h3>
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/projects"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  View All Projects
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <FiSettings className="text-xl" />
            Settings
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
