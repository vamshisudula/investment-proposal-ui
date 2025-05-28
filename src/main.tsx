import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Main app
createRoot(document.getElementById("root")!).render(<App />);

// Stagewise toolbar (development only)
if (import.meta.env.DEV) {
  // 1. Import the toolbar
  import('@stagewise/toolbar').then(({ initToolbar }) => {
    // 2. Define your toolbar configuration
    const stagewiseConfig = {
      plugins: [
        {
          name: 'example-plugin',
          description: 'Adds additional context for your components',
          shortInfoForPrompt: () => {
            return "Context information about the selected element";
          },
          mcp: null,
          actions: [
            {
              name: 'Example Action',
              description: 'Demonstrates a custom action',
              execute: () => {
                window.alert('This is a custom action!');
              },
            },
          ],
        },
      ],
    };

    // 3. Initialize the toolbar when your app starts
    initToolbar(stagewiseConfig);
  }).catch((error) => {
    console.warn('Failed to load stagewise toolbar:', error);
  });
}
