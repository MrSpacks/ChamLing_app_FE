import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/Buttons/Button';

describe('Button Component', () => {
  test('отображает текст кнопки', () => {
    render(<Button text="Нажми меня" />);
    expect(screen.getByText('Нажми меня')).toBeInTheDocument();
  });

  test('вызывает onClick при клике', () => {
    const handleClick = jest.fn();
    render(<Button text="Нажми" onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Нажми'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('блокируется когда disabled=true', () => {
    render(<Button text="Нажми" disabled={true} />);
    
    const button = screen.getByText('Нажми');
    expect(button).toBeDisabled();
  });

  test('имеет правильный type', () => {
    render(<Button text="Отправить" type="submit" />);
    
    const button = screen.getByText('Отправить');
    expect(button).toHaveAttribute('type', 'submit');
  });

  test('по умолчанию type="button"', () => {
    render(<Button text="Кнопка" />);
    
    const button = screen.getByText('Кнопка');
    expect(button).toHaveAttribute('type', 'button');
  });
});

