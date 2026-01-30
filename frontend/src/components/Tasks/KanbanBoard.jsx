import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { tasksAPI, projectsAPI } from '../../services/api';
import Loading from '../Common/Loading';
import ErrorMessage from '../Common/ErrorMessage';
import Modal from '../Common/Modal';
import CreateTask from './CreateTask';
import TaskDetail from './TaskDetail';
import {
  FiArrowLeft,
  FiPlus,
  FiMoreHorizontal,
  FiCalendar,
  FiMessageSquare,
  FiPaperclip,
} from 'react-icons/fi';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', title: 'Review', color: 'bg-purple-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
];

const KanbanBoard = () => {
  const { id: projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createColumnId, setCreateColumnId] = useState('todo');

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectRes, tasksRes] = await Promise.all([
        projectsAPI.getOne(projectId),
        tasksAPI.getAll({ projectId }),
      ]);

      setProject(projectRes.data.data);
      setTasks(tasksRes.data.data.tasksByStatus);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load board');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a droppable
    if (!destination) return;

    // No change
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;
    const taskId = parseInt(draggableId);

    // Optimistic update
    const newTasks = { ...tasks };
    const [movedTask] = newTasks[sourceColumn].splice(source.index, 1);
    movedTask.status = destColumn;
    newTasks[destColumn].splice(destination.index, 0, movedTask);
    setTasks(newTasks);

    try {
      await tasksAPI.move(taskId, {
        status: destColumn,
        position: destination.index,
      });
    } catch (err) {
      console.error('Error moving task:', err);
      // Revert on error
      fetchData();
      setError('Failed to move task');
    }
  };

  const handleCreateTask = (newTask) => {
    setTasks({
      ...tasks,
      [newTask.status]: [...tasks[newTask.status], newTask],
    });
    setShowCreateModal(false);
  };

  const handleTaskUpdate = (updatedTask) => {
    const newTasks = { ...tasks };
    
    // Remove from old status column
    Object.keys(newTasks).forEach((status) => {
      newTasks[status] = newTasks[status].filter((t) => t.id !== updatedTask.id);
    });
    
    // Add to new status column
    newTasks[updatedTask.status].push(updatedTask);
    setTasks(newTasks);
    setSelectedTask(null);
  };

  const handleTaskDelete = (taskId) => {
    const newTasks = { ...tasks };
    Object.keys(newTasks).forEach((status) => {
      newTasks[status] = newTasks[status].filter((t) => t.id !== taskId);
    });
    setTasks(newTasks);
    setSelectedTask(null);
  };

  const openCreateModal = (columnId) => {
    setCreateColumnId(columnId);
    setShowCreateModal(true);
  };

  if (loading) {
    return <Loading text="Loading board..." />;
  }

  if (error && !project) {
    return (
      <div className="space-y-4">
        <Link
          to={`/projects/${projectId}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft />
          Back to Project
        </Link>
        <ErrorMessage type="error" message={error} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to={`/projects/${projectId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft />
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: project?.color || '#6366f1' }}
            >
              <span className="text-white font-bold">
                {project?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{project?.name}</h1>
              <p className="text-sm text-gray-500">Kanban Board</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => openCreateModal('todo')}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus />
          Add Task
        </button>
      </div>

      {error && <ErrorMessage type="error" message={error} onClose={() => setError(null)} />}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 bg-gray-100 rounded-xl"
            >
              {/* Column Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h3 className="font-semibold text-gray-700">{column.title}</h3>
                    <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                      {tasks[column.id]?.length || 0}
                    </span>
                  </div>
                  <button
                    onClick={() => openCreateModal(column.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-2 kanban-column ${
                      snapshot.isDraggingOver ? 'bg-gray-200' : ''
                    }`}
                  >
                    {tasks[column.id]?.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={String(task.id)}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setSelectedTask(task)}
                            className={`task-card bg-white rounded-lg p-3 mb-2 cursor-pointer border border-gray-200 ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <TaskCard task={task} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Task"
        size="md"
      >
        <CreateTask
          projectId={parseInt(projectId)}
          initialStatus={createColumnId}
          onSuccess={handleCreateTask}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

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

const TaskCard = ({ task }) => {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      {/* Priority Badge */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${
            priorityColors[task.priority]
          }`}
        >
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          {task.due_date && (
            <span className="flex items-center gap-1">
              <FiCalendar />
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
          {task.comment_count > 0 && (
            <span className="flex items-center gap-1">
              <FiMessageSquare />
              {task.comment_count}
            </span>
          )}
          {task.attachment_count > 0 && (
            <span className="flex items-center gap-1">
              <FiPaperclip />
              {task.attachment_count}
            </span>
          )}
        </div>

        {/* Assignee */}
        {task.assigned_to && (
          <div className="flex items-center">
            {task.assigned_avatar ? (
              <img
                src={task.assigned_avatar}
                alt={task.assigned_name || task.assigned_username}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-medium">
                {(task.assigned_name || task.assigned_username)?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanBoard;
