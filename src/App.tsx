/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import {
  deleteTodo,
  getTodos,
  // patchTodo,
  postTodo,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';
import cn from 'classnames';
import { ErrorNotification } from './components/ErrorNotification';

const prepareTodoList = (todoData: Todo[], filter: string): Todo[] => {
  return todoData.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.completed;
      case 'completed':
        return todo.completed;
      default:
        return true;
    }
  });
};

export const App: React.FC = () => {
  const [todoData, setTodoData] = useState<Todo[]>([]);

  const [todoTitle, setTodoTitle] = useState('');

  const [filterParam, setFilterParam] = useState('all');

  const [errorMessage, setErrorMessage] = useState('');

  const [isInputActive, setIsInputActive] = useState(true);

  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const [deletedTodo, setDeletedTodo] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const activeTodos = todoData.filter(todo => !todo.completed).length;

  const isCompletedTodos = todoData.some(todo => todo.completed);

  const isAllTodosCompleted =
    todoData.length > 0 && todoData.every(todo => todo.completed);

  useEffect(() => {
    getTodos()
      .then(setTodoData)
      .catch(() => setErrorMessage('Unable to load todos'));
  }, []);

  const handleSubmit = (title: string) => {
    if (!title) {
      setErrorMessage('Title should not be empty');

      return;
    }

    setIsInputActive(false);

    const newTodo = {
      userId: USER_ID,
      title: title,
      completed: false,
    };

    setTempTodo({ id: 0, ...newTodo });

    postTodo(newTodo)
      .then(todo => {
        setTodoData(current => [...current, todo]);
        setTodoTitle('');
      })
      .catch(() => setErrorMessage('Unable to add a todo'))
      .finally(() => {
        setIsInputActive(true);
        setTempTodo(null);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      });
  };

  const handleDelete = (id: number) => {
    setDeletedTodo(cur => [...cur, id]);

    deleteTodo(id)
      .then(() => setTodoData(cur => cur.filter(todo => todo.id !== id)))
      .catch(() => setErrorMessage('Unable to delete a todo'))
      .finally(() => {
        setDeletedTodo(cur => cur.filter(curId => curId !== id));
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      });
  };

  const handleClearCompleted = () => {
    const completedIds = todoData
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    setDeletedTodo(cur => [...cur, ...completedIds]);

    Promise.allSettled(completedIds.map(id => deleteTodo(id).then(() => id)))
      .then(results => {
        const succesIds = results
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value);

        const isSomeFailed = results.some(r => r.status === 'rejected');

        if (isSomeFailed) {
          setErrorMessage('Unable to delete a todo');
        }

        setTodoData(cur => cur.filter(todo => !succesIds.includes(todo.id)));
      })
      .finally(() => {
        setDeletedTodo(cur => cur.filter(id => !completedIds.includes(id)));
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      });
  };

  // const handleUpdate = () => {
  //   if (false) {
  //     createErrorMessage('Unable to update a todo');
  //   }

  //   patchTodo();
  // };

  const handleSwitchStatus = (currentId: number) => {
    const index = todoData.findIndex(todo => todo.id === currentId);

    const { id, userId, title, completed } = todoData[index];
    const replacer = {
      id,
      userId,
      title,
      completed: completed ? false : true,
    };

    setTodoData(current => {
      const updated = [...current];

      updated.splice(index, 1, replacer);

      return updated;
    });
  };

  const todoList = prepareTodoList(todoData, filterParam);

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          <button
            type="button"
            className={cn('todoapp__toggle-all', {
              active: isAllTodosCompleted,
            })}
            data-cy="ToggleAllButton"
          />

          <form
            onSubmit={event => {
              event.preventDefault();
              handleSubmit(todoTitle.trim());
            }}
          >
            <input
              ref={inputRef}
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={todoTitle}
              onChange={event => setTodoTitle(event.target.value)}
              autoFocus
              disabled={!isInputActive}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {todoList.map((todo: Todo) => {
            const { id, title, completed } = todo;
            const isOverlayActive = deletedTodo.includes(id);

            return (
              <div
                key={id}
                data-cy="Todo"
                className={cn('todo', { completed: completed })}
              >
                <label className="todo__status-label">
                  <input
                    data-cy="TodoStatus"
                    type="checkbox"
                    className="todo__status"
                    checked={completed}
                    onClick={() => handleSwitchStatus(id)}
                  />
                </label>

                {true ? (
                  <>
                    <span data-cy="TodoTitle" className="todo__title">
                      {title}
                    </span>

                    <button
                      type="button"
                      className="todo__remove"
                      data-cy="TodoDelete"
                      onClick={() => handleDelete(id)}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  // This form is shown instead of the title and remove button
                  <form>
                    <input
                      data-cy="TodoTitleField"
                      type="text"
                      className="todo__title-field"
                      placeholder="Empty todo will be deleted"
                      value="Todo is being edited now"
                    />
                  </form>
                )}

                {/* overlay will cover the todo while it is being deleted or updated */}
                {/* 'is-active' class puts this modal on top of the todo */}
                <div
                  data-cy="TodoLoader"
                  className={cn('modal', 'overlay', {
                    'is-active': isOverlayActive,
                  })}
                >
                  <div className="modal-background has-background-white-ter" />
                  <div className="loader" />
                </div>
              </div>
            );
          })}

          {tempTodo && (
            <div className="todo" data-cy="Todo">
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                />
              </label>

              <span data-cy="TodoTitle" className="todo__title">
                {tempTodo.title}
              </span>

              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
              >
                ×
              </button>

              <div
                data-cy="TodoLoader"
                className={cn('modal', 'overlay', 'is-active')}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          )}
        </section>

        {(todoData.length > 0 || activeTodos > 0) && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {`${activeTodos} items left`}
            </span>

            <nav className="filter" data-cy="Filter">
              {/* створити массив с обьектами (стринга, енем.значення) orr just enum*/}
              <a
                href="#/"
                className={cn('filter__link', {
                  selected: filterParam === 'all',
                })}
                data-cy="FilterLinkAll"
                onClick={() => setFilterParam('all')}
              >
                All
              </a>

              <a
                href="#/active"
                className={cn('filter__link', {
                  selected: filterParam === 'active',
                })}
                data-cy="FilterLinkActive"
                onClick={() => setFilterParam('active')}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={cn('filter__link', {
                  selected: filterParam === 'completed',
                })}
                data-cy="FilterLinkCompleted"
                onClick={() => setFilterParam('completed')}
              >
                Completed
              </a>
            </nav>

            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              disabled={!isCompletedTodos}
              onClick={() => handleClearCompleted()}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      <ErrorNotification
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
    </div>
  );
};
