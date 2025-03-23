import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Dynamic JSON Processor/i);
  expect(headerElement).toBeInTheDocument();
  
  const subHeaderElement = screen.getByText(/Process multiple JSON files with different structures/i);
  expect(subHeaderElement).toBeInTheDocument();
});
