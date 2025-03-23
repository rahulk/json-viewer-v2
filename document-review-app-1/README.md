# Document Review Application

This project is a React application designed for reviewing documents, specifically PDF files. It features a clean and organized layout with a header, sidebar, and main content area.

## Project Structure

The project is structured as follows:

```
document-review-app
├── public
│   └── index.html          # Main HTML file for the React application
├── src
│   ├── components          # Contains all React components
│   │   ├── Header          # Header component displaying the title
│   │   ├── Sidebar         # Sidebar component with PDF folders and files
│   │   ├── MainContent     # Main content area with tabs and viewer
│   │   ├── PageViewer      # Component for displaying content
│   │   └── Tabs            # Tabbed interface for navigation
│   ├── App.js              # Main application component
│   ├── index.js            # Entry point of the React application
├── package.json            # Project configuration and dependencies
└── README.md               # Project documentation
```

## Features

- **Header**: Displays the title "Document Review Application."
- **Sidebar**: Contains two lists for "pdf folders" and "pdf files."
- **Main Content**: Divided into two parts:
  - A dummy placeholder page viewer.
  - Multiple tabs labeled <tab1>, <tab2>, <tab3>, <tab4>, and <tab5>.
    - The first three tabs display a placeholder HTML viewer.
    - The last two tabs show the current viewer.

## Getting Started

To get started with the project, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd document-review-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm start
   ```

The application will be available at `http://localhost:3000`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.