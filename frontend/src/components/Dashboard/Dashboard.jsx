import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectsAPI, tasksAPI } from '../../services/api';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import {
  FiFolder,
  FiCheckSquare,
  FiClock,
  FiTrendingUp,
  FiArrowRight,
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
  });
  const [projects, setProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [tasksByStatus, setTasksByStatus] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch projects
      const projectsRes = await projectsAPI.getAll();
      const projectsData = projectsRes.data.data;
      setProjects(projectsData.slice(0, 5));

      // Fetch my tasks
      const tasksRes = await tasksAPI.getMyTasks();
      const tasksData = tasksRes.data.data;
      setRecentTasks(tasksData.slice(0, 5));

      // Calculate stats
      const totalProjects = projectsData.length;
      const totalTasks = tasksData.length;
      const completedTasks = tasksData.filter((t) => t.status === 'done').length;
      const pendingTasks = tasksData.filter((t) => t.status !== 'done').length;
      const overdueTasks = tasksData.filter(
        (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
      ).length;

      setStats({
        totalProjects,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
      });

      // Task distribution by status
      const statusCounts = {
        todo: tasksData.filter((t) => t.status === 'todo').length,
        in_progress: tasksData.filter((t) => t.status === 'in_progress').length,
        review: tasksData.filter((t) => t.status === 'review').length,
        done: completedTasks,
      };

      setTasksByStatus([
        { name: 'To Do', value: statusCounts.todo, color: '#6b7280' },
        { name: 'In Progress', value: statusCounts.in_progress, color: '#3b82f6' },
        { name: 'Review', value: statusCounts.review, color: '#8b5cf6' },
        { name: 'Done', value: statusCounts.done, color: '#22c55e' },
      ]);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading text="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorMessage type="error" message={error} />;
  }

  const statCards = [
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      icon: FiFolder,
      color: 'bg-blue-500',
      link: '/projects',
    },
    {
      label: 'My Tasks',
      value: stats.totalTasks,
      icon: FiCheckSquare,
      color: 'bg-purple-500',
      link: '/my-tasks',
    },
    {
      label: 'Completed',
      value: stats.completedTasks,
      icon: FiTrendingUp,
      color: 'bg-green-500',
    },
    {
      label: 'Overdue',
      value: stats.overdueTasks,
      icon: FiClock,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name || user?.username}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-2xl text-white" />
              </div>
            </div>
            {stat.link && (
              <Link
                to={stat.link}
                className="text-sm text-primary-600 hover:text-primary-700 mt-4 inline-flex items-center gap-1"
              >
                View all <FiArrowRight />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Distribution</h3>
          {tasksByStatus.some((t) => t.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={tasksByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No tasks yet
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {tasksByStatus.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Task Progress Bar Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks Overview</h3>
          {tasksByStatus.some((t) => t.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={tasksByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No tasks yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
            <Link
              to="/projects"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {projects.length > 0 ? (
              projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: project.color || '#6366f1' }}
                  >
                    <FiFolder className="text-white text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{project.name}</p>
                    <p className="text-sm text-gray-500">
                      {project.task_count} tasks · {project.member_count} members
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No projects yet.{' '}
                <Link to="/projects?create=true" className="text-primary-600">
                  Create one
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">My Tasks</h3>
            <Link
              to="/my-tasks"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      task.priority === 'urgent'
                        ? 'bg-red-500'
                        : task.priority === 'high'
                        ? 'bg-orange-500'
                        : task.priority === 'medium'
                        ? 'bg-blue-500'
                        : 'bg-gray-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-sm text-gray-500">
                      {task.project_name}
                      {task.due_date && (
                        <span className="ml-2">
                          · Due {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.status === 'done'
                        ? 'status-done'
                        : task.status === 'in_progress'
                        ? 'status-in_progress'
                        : task.status === 'review'
                        ? 'status-review'
                        : 'status-todo'
                    }`}
                  >
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No tasks assigned to you yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
