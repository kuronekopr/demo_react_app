import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, ListChecks } from 'lucide-react';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onAddTask(inputText.trim());
    setInputText('');
  };

  return (
    <div className="glass-panel card-padding task-manager">
      <div className="card-header">
        <h3 className="card-title">
          <ListChecks size={18} className="text-primary-color" />
          <span>タスクマネージャー</span>
        </h3>
        <span className="badge" style={{ 
          fontSize: '11px', 
          background: 'hsla(var(--primary)/0.1)', 
          color: 'hsl(var(--primary))',
          padding: '4px 8px',
          borderRadius: '6px',
          fontWeight: 600
        }}>
          {tasks.filter(t => t.completed).length} / {tasks.length} 完了
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="task-input-row">
        <input
          type="text"
          className="glass-input"
          placeholder="新しいタスクを入力してください..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" className="btn-primary" style={{ padding: '0 16px', height: '44px' }}>
          <Plus size={18} />
          <span className="btn-text-responsive" style={{ display: 'none' }}>追加</span>
        </button>
      </form>

      {/* Task List */}
      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-task-placeholder">
            <CheckSquare size={32} style={{ opacity: 0.3 }} />
            <p className="empty-task-text">登録されているタスクはありません</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id} 
              className={`task-item ${task.completed ? 'completed' : ''}`}
            >
              <div className="task-left-section">
                <button
                  type="button"
                  className={`task-checkbox-wrap ${task.completed ? 'checked' : ''}`}
                  onClick={() => onToggleTask(task.id)}
                >
                  {task.completed && <CheckSquare size={12} style={{ fill: 'currentColor' }} />}
                </button>
                <span className="task-content-text">{task.text}</span>
              </div>
              <button
                type="button"
                className="task-delete-btn"
                onClick={() => onDeleteTask(task.id)}
                title="タスクを削除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
