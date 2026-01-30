import { FiAlertCircle, FiAlertTriangle, FiInfo, FiCheckCircle, FiX } from 'react-icons/fi';

const ErrorMessage = ({ 
  type = 'error', 
  message, 
  title,
  onClose,
  className = '' 
}) => {
  const types = {
    error: {
      icon: FiAlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      iconColor: 'text-red-500',
    },
    warning: {
      icon: FiAlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      iconColor: 'text-yellow-500',
    },
    info: {
      icon: FiInfo,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-500',
    },
    success: {
      icon: FiCheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      iconColor: 'text-green-500',
    },
  };

  const config = types[type] || types.error;
  const Icon = config.icon;

  if (!message) return null;

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} ${config.textColor} border rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`${config.iconColor} text-xl flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          {title && <h4 className="font-medium mb-1">{title}</h4>}
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <FiX className="text-lg" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
