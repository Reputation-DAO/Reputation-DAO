import { useParams } from 'react-router-dom';
import MarkdownRenderer from './MarkdownRenderer';

/**
 * Generic doc page component that renders markdown based on the route
 * Handles nested routes like /docs/concepts/overview
 */
const DocPage = () => {
  const params = useParams();
  
  // Build the file path from route params
  // e.g., /docs/concepts/overview -> concepts/overview
  const filePath = params['*'] || 'index';
  
  return <MarkdownRenderer filePath={filePath} />;
};

export default DocPage;
