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
import { TodoList } from './components/TodoList';

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
  const [errorMessage, setErrorMessage] = useState('');

  const [todoTitle, setTodoTitle] = useState('');

  const [filterParam, setFilterParam] = useState('all');

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

        <TodoList
          todoList={todoList}
          todoData={todoData}
          tempTodo={tempTodo}
          deletedTodo={deletedTodo}
          setTodoData={setTodoData}
          setDeletedTodo={setDeletedTodo}
          setErrorMessage={setErrorMessage}
          inputRef={inputRef}
        />

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
