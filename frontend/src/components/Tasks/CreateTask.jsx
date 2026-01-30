import { useState, useEffect } from 'react';
import { tasksAPI, usersAPI } from '../../services/api';
import ErrorMessage from '../Common/ErrorMessage';

const CreateTask = ({ projectId, initialStatus = 'todo', onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    project_id: projectId,
    title: '',
    description: '',
    status: initialStatus,
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    labels: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError(null);
  };

  const handleUserSearch = async (query) => {
    setUserSearch(query);
    if (query.length < 2) {
      setUserResults([]);
      return;
    }

    try {
      setSearchingUsers(true);
      const response = await usersAPI.search(query);
      setUserResults(response.data.data);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setFormData({ ...formData, assigned_to: user.id });
    setUserSearch('');
    setUserResults([]);
  };

  const clearUser = () => {
    setSelectedUser(null);
    setFormData({ ...formData, assigned_to: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submitData = {
        ...formData,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date || null,
      };

      const response = await tasksAPI.create(submitData);
      onSuccess(response.data.data);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorMessage type="error" message={error} />}

      {/* Title */}
      <div>
        <label htmlFor="title" className="form-label">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={formData.title}
          onChange={handleChange}
          className="form-input"
          placeholder="Enter task title"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="form-label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="form-input"
          placeholder="Describe the task..."
        />
      </div>

      {/* Status & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="form-label">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="form-input"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="form-label">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="form-input"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Assignee */}
      <div>
        <label className="form-label">Assign To</label>
        {selectedUser ? (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <div className="avatar avatar-sm">
              {selectedUser.full_name?.charAt(0) || selectedUser.username.charAt(0)}
            </div>
            <span className="flex-1">{selectedUser.full_name || selectedUser.username}</span>
            <button
              type="button"
              onClick={clearUser}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => handleUserSearch(e.target.value)}
              className="form-input"
              placeholder="Search by name or email..."
            />
            {userResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {userResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectUser(user)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                  >
                    <div className="avatar avatar-sm">
                      {user.full_name?.charAt(0) || user.username.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.full_name || user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Due Date */}
      <div>
        <label htmlFor="due_date" className="form-label">
          Due Date
        </label>
        <input
          id="due_date"
          name="due_date"
          type="date"
          value={formData.due_date}
          onChange={handleChange}
          className="form-input"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};

export default CreateTask;
