// src/components/TestBlogBackend.tsx
import { useEffect, useState } from 'react';
import { blogActor } from '../components/canister/blogBackend';
import type { Post } from '../components/canister/blogBackend'; // <== Notice `import type`



export default function TestBlogBackend() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const allPosts = await blogActor.getPosts();
        setPosts(allPosts);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch posts');
      }
    }
    fetchPosts();
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!posts.length) return <div>Loading posts...</div>;

  return (
    <div>
      <h1>Blog Posts</h1>
      {posts.map(post => (
        <article key={post.id.toString()}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
          <small>Author: {post.author.name}</small>
        </article>
      ))}
    </div>
  );
}
