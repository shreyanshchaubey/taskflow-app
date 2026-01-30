import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { projectsAPI } from '../../services/api';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import Modal from '../Common/Modal';
import CreateProject from './CreateProject';
import { FiPlus, FiFolder, FiUsers, FiCheckSquare, FiSearch, FiFilter } from 'react-icons/fi';

const ProjectList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('create') === 'true');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (searchQuery) params.search = searchQuery;
      
      const response = await projectsAPI.getAll(params);
      setProjects(response.data.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleCreateSuccess = (newProject) => {
    setProjects([newProject, ...projects]);
    setShowCreateModal(false);
    setSearchParams({});
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setSearchParams({});
  };

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    return (
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return <Loading text="Loading projects..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Manage your projects and collaborate with your team</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus />
          New Project
        </button>
      </div>

      {error && <ErrorMessage type="error" message={error} onClose={() => setError(null)} />}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-input py-2"
          >
            <option value="all">All Projects</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <FiFolder className="mx-auto text-4xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? 'Try a different search term'
              : "Get started by creating your first project"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Create Project
            </button>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={showCreateModal} onClose={closeModal} title="Create New Project">
        <CreateProject onSuccess={handleCreateSuccess} onCancel={closeModal} />
      </Modal>
    </div>
  );
};

const ProjectCard = ({ project }) => {
  const completionPercentage =
    project.task_count > 0
      ? Math.round((project.completed_task_count / project.task_count) * 100)
      : 0;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="card hover:shadow-md transition-shadow"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: project.color || '#6366f1' }}
          >
            <FiFolder className="text-white text-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
            <p className="text-sm text-gray-500 truncate">
              {project.owner_name || project.owner_username}
            </p>
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              project.status === 'active'
                ? 'bg-green-100 text-green-700'
                : project.status === 'completed'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {project.status}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium text-gray-700">{completionPercentage}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <FiCheckSquare />
            <span>{project.task_count} tasks</span>
          </div>
          <div className="flex items-center gap-1">
            <FiUsers />
            <span>{project.member_count} members</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectList;
