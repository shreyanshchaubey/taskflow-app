import { useState, useEffect } from 'react';
import { tasksAPI, commentsAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import { FiEdit2, FiTrash2, FiCalendar, FiUser, FiSend, FiClock } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const TaskDetail = ({ taskId, onUpdate, onDelete, onClose }) => {
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tasksAPI.getOne(taskId);
      setTask(response.data.data);
      setEditData(response.data.data);
    } catch (err) {
      console.error('Error fetching task:', err);
      setError(err.response?.data?.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await tasksAPI.update(taskId, {
        title: editData.title,
        description: editData.description,
        status: editData.status,
        priority: editData.priority,
        assigned_to: editData.assigned_to || null,
        due_date: editData.due_date || null,
      });
      setTask(response.data.data);
      setIsEditing(false);
      onUpdate(response.data.data);
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.response?.data?.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      setDeleting(true);
      await tasksAPI.delete(taskId);
      onDelete(taskId);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await commentsAPI.create(taskId, { content: newComment });
      setTask({
        ...task,
        comments: [...task.comments, response.data.data],
      });
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentsAPI.delete(commentId);
      setTask({
        ...task,
        comments: task.comments.filter((c) => c.id !== commentId),
      });
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  if (loading) {
    return <Loading text="Loading task..." />;
  }

  if (error && !task) {
    return <ErrorMessage type="error" message={error} />;
  }

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

  return (
    <div className="space-y-6">
      {error && <ErrorMessage type="error" message={error} onClose={() => setError(null)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEditing ? (
            <input
              name="title"
              value={editData.title}
              onChange={handleEditChange}
              className="form-input text-xl font-bold"
            />
          ) : (
            <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <FiEdit2 />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                disabled={deleting}
              >
                <FiTrash2 />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status & Priority */}
      <div className="flex items-center gap-4">
        {isEditing ? (
          <>
            <select
              name="status"
              value={editData.status}
              onChange={handleEditChange}
              className="form-input py-1 text-sm"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
            <select
              name="priority"
              value={editData.priority}
              onChange={handleEditChange}
              className="form-input py-1 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </>
        ) : (
          <>
            <span className={`px-2 py-1 text-sm font-medium rounded ${statusColors[task.status]}`}>
              {task.status.replace('_', ' ')}
            </span>
            <span className={`px-2 py-1 text-sm font-medium rounded ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
          </>
        )}
      </div>

      {/* Description */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
        {isEditing ? (
          <textarea
            name="description"
            value={editData.description || ''}
            onChange={handleEditChange}
            rows={4}
            className="form-input"
            placeholder="Add a description..."
          />
        ) : (
          <p className="text-gray-600">
            {task.description || <span className="text-gray-400 italic">No description</span>}
          </p>
        )}
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <FiUser className="text-gray-400" />
            Assignee
          </h3>
          {task.assigned_to ? (
            <div className="flex items-center gap-2">
              <div className="avatar avatar-sm">
                {(task.assigned_name || task.assigned_username)?.charAt(0).toUpperCase()}
              </div>
              <span>{task.assigned_name || task.assigned_username}</span>
            </div>
          ) : (
            <span className="text-gray-400 italic">Unassigned</span>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <FiCalendar className="text-gray-400" />
            Due Date
          </h3>
          {isEditing ? (
            <input
              name="due_date"
              type="date"
              value={editData.due_date?.split('T')[0] || ''}
              onChange={handleEditChange}
              className="form-input py-1"
            />
          ) : task.due_date ? (
            <span>{new Date(task.due_date).toLocaleDateString()}</span>
          ) : (
            <span className="text-gray-400 italic">No due date</span>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-4">
          Comments ({task.comments?.length || 0})
        </h3>

        {/* Comment List */}
        <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
          {task.comments?.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="avatar avatar-sm flex-shrink-0">
                {(comment.full_name || comment.username)?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">
                    {comment.full_name || comment.username}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                    {comment.user_id === user.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="form-input flex-1"
            placeholder="Write a comment..."
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submittingComment || !newComment.trim()}
          >
            <FiSend />
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="border-t pt-4 text-xs text-gray-400 flex items-center gap-4">
        <span className="flex items-center gap-1">
          <FiClock />
          Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
        </span>
        {task.creator_name && <span>by {task.creator_name || task.creator_username}</span>}
      </div>
    </div>
  );
};

export default TaskDetail;
