import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import Modal from '../Common/Modal';
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiCheckSquare,
  FiCalendar,
  FiUserPlus,
  FiGrid,
} from 'react-icons/fi';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = project?.owner_id === user?.id;

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsAPI.getOne(id);
      setProject(response.data.data);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      setDeleting(true);
      await projectsAPI.delete(id);
      navigate('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      setAddingMember(true);
      await projectsAPI.addMember(id, { email: memberEmail });
      setMemberEmail('');
      setShowAddMemberModal(false);
      fetchProject(); // Refresh project data
    } catch (err) {
      console.error('Error adding member:', err);
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await projectsAPI.removeMember(id, userId);
      fetchProject();
    } catch (err) {
      console.error('Error removing member:', err);
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return <Loading text="Loading project..." />;
  }

  if (error && !project) {
    return (
      <div className="space-y-4">
        <Link to="/projects" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <FiArrowLeft />
          Back to Projects
        </Link>
        <ErrorMessage type="error" message={error} />
      </div>
    );
  }

  const totalTasks = project.totalTasks || 0;
  const completedTasks = project.taskStats?.done || 0;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/projects" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <FiArrowLeft />
        Back to Projects
      </Link>

      {error && <ErrorMessage type="error" message={error} onClose={() => setError(null)} />}

      {/* Project Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: project.color || '#6366f1' }}
            >
              <span className="text-white text-2xl font-bold">
                {project.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-gray-600 mt-1">{project.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FiUsers />
                  {(project.members?.length || 0) + 1} members
                </span>
                <span className="flex items-center gap-1">
                  <FiCheckSquare />
                  {totalTasks} tasks
                </span>
                <span className="flex items-center gap-1">
                  <FiCalendar />
                  Created {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/projects/${id}/board`}
              className="btn btn-primary flex items-center gap-2"
            >
              <FiGrid />
              Kanban Board
            </Link>
            {isOwner && (
              <>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <FiUserPlus />
                  Add Member
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Overall Progress</span>
            <span className="font-medium text-gray-700">
              {completedTasks} of {totalTasks} tasks completed ({completionPercentage}%)
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'To Do', value: project.taskStats?.todo || 0, color: 'bg-gray-500' },
          { label: 'In Progress', value: project.taskStats?.in_progress || 0, color: 'bg-blue-500' },
          { label: 'Review', value: project.taskStats?.review || 0, color: 'bg-purple-500' },
          { label: 'Done', value: project.taskStats?.done || 0, color: 'bg-green-500' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Team Members */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {/* Owner */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              {project.owner_avatar ? (
                <img
                  src={project.owner_avatar}
                  alt={project.owner_name || project.owner_username}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="avatar avatar-md">
                  {(project.owner_name || project.owner_username)?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {project.owner_name || project.owner_username}
                </p>
                <p className="text-sm text-gray-500">Owner</p>
              </div>
            </div>
          </div>

          {/* Members */}
          {project.members?.map((member) => (
            <div key={member.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.full_name || member.username}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="avatar avatar-md">
                    {(member.full_name || member.username)?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {member.full_name || member.username}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                </div>
              </div>
              {isOwner && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                >
                  <FiTrash2 />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{project.name}</strong>? This action cannot be
            undone and will delete all tasks and data associated with this project.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn btn-secondary"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteProject}
              className="btn btn-danger"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Add Team Member"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label htmlFor="memberEmail" className="form-label">
              Email Address
            </label>
            <input
              id="memberEmail"
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              className="form-input"
              placeholder="Enter member's email"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddMemberModal(false)}
              className="btn btn-secondary"
              disabled={addingMember}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={addingMember}>
              {addingMember ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
