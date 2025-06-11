/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import * as todosApi from './api/todos';

import { FilterParams } from './types/FilterParams';

import { UserWarning } from './UserWarning';
import { Todo } from './types/Todo';
import { AppHeader } from './components/AppHeader';
import { TodoList } from './components/TodoList';
import { AppFooter } from './components/AppFooter';
import { ErrorNotification } from './components/ErrorNotification';

const prepareTodoList = (todoData: Todo[], filter: FilterParams): Todo[] => {
  return todoData.filter(todo => {
    switch (filter) {
      case FilterParams.Active:
        return !todo.completed;
      case FilterParams.Completed:
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

  const [filterParam, setFilterParam] = useState(FilterParams.All);

  const [isInputActive, setIsInputActive] = useState(true);

  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const [deletedTodo, setDeletedTodo] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const activeTodos = todoData.filter(todo => !todo.completed).length;

  const isCompletedTodos = todoData.some(todo => todo.completed);

  const isAllTodosCompleted =
    todoData.length > 0 && todoData.every(todo => todo.completed);

  useEffect(() => {
    todosApi
      .getTodos()
      .then(setTodoData)
      .catch(() => setErrorMessage('Unable to load todos'));
  }, []);

  // Мастер, скажи чи виносить цей хендлер в компонент AppHeader (він спрацьовує на сабмит) чи залишать тут?
  const handleSubmit = (title: string) => {
    if (!title) {
      setErrorMessage('Title should not be empty');

      return;
    }

    setIsInputActive(false);

    const newTodo = {
      userId: todosApi.USER_ID,
      title: title,
      completed: false,
    };

    setTempTodo({ id: 0, ...newTodo });

    todosApi
      .postTodo(newTodo)
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

  // а это в компонент AppFooter ?
  const handleClearCompleted = () => {
    const completedIds = todoData
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    setDeletedTodo(cur => [...cur, ...completedIds]);

    Promise.allSettled(
      completedIds.map(id => todosApi.deleteTodo(id).then(() => id)),
    )
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

  if (!todosApi.USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <AppHeader
          onSubmit={handleSubmit}
          todoTitle={todoTitle}
          setTodoTitle={setTodoTitle}
          isInputActive={isInputActive}
          inputRef={inputRef}
          isAllTodosCompleted={isAllTodosCompleted}
        />

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
          <AppFooter
            handleClearCompleted={handleClearCompleted}
            setFilterParam={setFilterParam}
            filterParam={filterParam}
            isCompletedTodos={isCompletedTodos}
            activeTodos={activeTodos}
          />
        )}
      </div>

      <ErrorNotification
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
    </div>
  );
};
