import { useState, useEffect } from 'react';
import { tasksAPI } from '../../services/api';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import Modal from '../Common/Modal';
import TaskDetail from './TaskDetail';
import {
  FiFilter,
  FiCheckSquare,
  FiClock,
  FiAlertTriangle,
  FiCalendar,
} from 'react-icons/fi';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      
      if (filter === 'overdue') {
        params.dueDate = 'overdue';
      } else if (filter === 'today') {
        params.dueDate = 'today';
      } else if (filter === 'week') {
        params.dueDate = 'week';
      } else if (filter !== 'all') {
        params.status = filter;
      }

      const response = await tasksAPI.getMyTasks(params);
      setTasks(response.data.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)));
    setSelectedTask(null);
  };

  const handleTaskDelete = (taskId) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'done').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    overdue: tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
    ).length,
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  const statusColors = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-purple-100 text-purple-700',
    done: 'bg-green-100 text-green-700',
  };

  if (loading) {
    return <Loading text="Loading your tasks..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-500 mt-1">View and manage all tasks assigned to you</p>
      </div>

      {error && <ErrorMessage type="error" message={error} onClose={() => setError(null)} />}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiCheckSquare className="text-blue-600 text-xl" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Tasks</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <FiCheckSquare className="text-green-600 text-xl" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FiClock className="text-purple-600 text-xl" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            <p className="text-sm text-gray-500">In Progress</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <FiAlertTriangle className="text-red-600 text-xl" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
            <p className="text-sm text-gray-500">Overdue</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <FiFilter className="text-gray-400" />
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'todo', label: 'To Do' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'review', label: 'Review' },
            { value: 'done', label: 'Done' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'today', label: 'Due Today' },
            { value: 'week', label: 'Due This Week' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === option.value
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {tasks.length > 0 ? (
        <div className="card divide-y divide-gray-100">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {/* Priority Indicator */}
              <div
                className={`w-2 h-2 rounded-full ${
                  task.priority === 'urgent'
                    ? 'bg-red-500'
                    : task.priority === 'high'
                    ? 'bg-orange-500'
                    : task.priority === 'medium'
                    ? 'bg-blue-500'
                    : 'bg-gray-400'
                }`}
              />

              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span
                    className="px-2 py-0.5 text-xs rounded"
                    style={{ backgroundColor: task.project_color + '20', color: task.project_color }}
                  >
                    {task.project_name}
                  </span>
                  {task.due_date && (
                    <span
                      className={`flex items-center gap-1 ${
                        new Date(task.due_date) < new Date() && task.status !== 'done'
                          ? 'text-red-500'
                          : ''
                      }`}
                    >
                      <FiCalendar />
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${statusColors[task.status]}`}
              >
                {task.status.replace('_', ' ')}
              </span>

              {/* Priority Badge */}
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${priorityColors[task.priority]}`}
              >
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FiCheckSquare className="mx-auto text-4xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">
            {filter !== 'all'
              ? 'Try adjusting your filters'
              : 'You have no tasks assigned to you yet'}
          </p>
        </div>
      )}

      {/* Task Detail Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Task Details"
        size="lg"
      >
        {selectedTask && (
          <TaskDetail
            taskId={selectedTask.id}
            onUpdate={handleTaskUpdate}
            onDelete={handleTaskDelete}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default MyTasks;
