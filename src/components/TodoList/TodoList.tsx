import React from 'react';
import { Todo } from '../../types/Todo';
import { deleteTodo } from '../../api/todos';
import { TodoItem } from '../TodoItem/TodoItem';

interface Props {
  todoList: Todo[];
  todoData: Todo[];
  tempTodo: Todo | null;
  deletedTodo: number[];
  setTodoData: React.Dispatch<React.SetStateAction<Todo[]>>;
  setDeletedTodo: React.Dispatch<React.SetStateAction<number[]>>;
  setErrorMessage: (msg: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const TodoList: React.FC<Props> = ({
  todoList,
  todoData,
  tempTodo,
  deletedTodo,
  setTodoData,
  setDeletedTodo,
  setErrorMessage,
  inputRef,
}) => {
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

  // const handleUpdate = () => {
  //   if (false) {
  //     createErrorMessage('Unable to update a todo');
  //   }

  //   patchTodo();
  // };

  return (
    <section className="todoapp__main" data-cy="TodoList">
      {todoList.map((todo: Todo) => {
        const isOverlayActive = deletedTodo.includes(todo.id);

        return (
          <TodoItem
            key={todo.id}
            todo={todo}
            isOverlayActive={isOverlayActive}
            handleDelete={handleDelete}
            handleSwitchStatus={handleSwitchStatus}
          />
        );
      })}

      {tempTodo && <TodoItem todo={tempTodo} />}
    </section>
  );
};
